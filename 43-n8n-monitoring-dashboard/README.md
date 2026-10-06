# 43 — n8n Observability Dashboard & Controlled Remediation

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Status](https://img.shields.io/badge/Status-Production--oriented%20Reference-0A7EA4)
![Metrics](https://img.shields.io/badge/Metrics-Prometheus-E6522C)
![Dashboard](https://img.shields.io/badge/Dashboard-Grafana-F46800)
![Automation](https://img.shields.io/badge/Automation-n8n-EA4B71)

A monitoring reference for n8n that combines Prometheus scraping, a Grafana dashboard, and an n8n workflow that evaluates selected metrics, emits Slack warnings, and demonstrates a worker-restart remediation path.

> **Scope:** this repository demonstrates observability and remediation patterns. It is not a turnkey production monitoring platform. Several assumptions in the current configuration — especially networking, metric names, memory thresholds, and Docker API access — must be validated before live use.

## Business Problem

Automation platforms need more than “the workflow ran.”

Operators also need to know:

- whether the n8n process is healthy,
- whether memory use is trending upward,
- whether queue depth is growing,
- whether worker capacity is sufficient,
- whether alerts are actionable,
- whether remediation is safe,
- whether monitoring itself is still functioning.

This project separates those responsibilities into two layers:

```text
Prometheus + Grafana
    → observation and historical visibility

n8n monitoring workflow
    → policy evaluation, alerting, and remediation demo
```

That distinction matters: dashboards explain what is happening, while remediation workflows decide what action — if any — is allowed.

---

## Architecture

```text
                         ┌──────────────────────┐
                         │ n8n metrics endpoint │
                         │      /metrics        │
                         └──────────┬───────────┘
                                    │
                         scrape     │
                                    ▼
                         ┌──────────────────────┐
                         │ Prometheus           │
                         │ 15s scrape interval  │
                         └──────────┬───────────┘
                                    │
                              PromQL│
                                    ▼
                         ┌──────────────────────┐
                         │ Grafana              │
                         │ dashboard / trends   │
                         └──────────────────────┘

     ┌────────────────────────────────────────────────────────────┐
     │ n8n monitoring workflow                                   │
     │                                                            │
     │ Every minute                                               │
     │      ↓                                                     │
     │ Fetch /metrics                                             │
     │      ↓                                                     │
     │ Parse selected metrics                                     │
     │      ↓                                                     │
     │ Memory threshold? ── yes ──> Docker restart demo          │
     │      │                                                     │
     │      no                                                    │
     │      ↓                                                     │
     │ Queue threshold? ── yes ──> Slack warning                 │
     │      │                                                     │
     │      no                                                    │
     │      ↓                                                     │
     │ Healthy status                                             │
     └────────────────────────────────────────────────────────────┘
```

## Repository Layout

```text
43-n8n-monitoring-dashboard/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── grafana/
│   └── dashboards/
│       └── n8n-overview.json
├── prometheus/
│   └── prometheus.yml
├── screenshots/
│   └── Screenshot 2026-08-06 204435.png
├── workflows/
│   └── n8n-infrastructure-monitor.json
└── README.md
```

---

## What Is Actually Implemented

The repository currently includes:

- a Prometheus container,
- a Grafana container,
- persistent Docker volumes for both,
- a 15-second Prometheus scrape configuration,
- a five-panel Grafana dashboard definition,
- an n8n workflow scheduled every minute,
- text parsing for selected Prometheus metrics,
- an 80% memory decision threshold,
- a queue-size threshold of 100,
- a Slack warning webhook,
- a Docker restart request for a configured worker container,
- a simple final health-status object.

The monitoring stack itself does **not** include an n8n service. It expects an existing n8n instance to be reachable.

---

## Docker Compose Stack

The Compose file starts only:

| Service | Port | Purpose |
|---|---:|---|
| Prometheus | 9090 | metric collection and query |
| Grafana | 3000 | visualization |

The file uses:

```text
prom/prometheus:latest
grafana/grafana:latest
```

For a controlled deployment, pin tested image versions instead of relying on `:latest`.

### Current persistence

Prometheus data is stored in:

```text
prometheus_data
```

Grafana state is stored in:

```text
grafana_data
```

The Compose file does not currently define container health checks, TLS, authentication in front of Prometheus, or network-level restrictions beyond the local Docker bridge.

---

## Important Networking Reality Check

The Prometheus configuration contains:

```yaml
- job_name: 'n8n'
  metrics_path: /metrics
  static_configs:
    - targets: ['n8n:5678']
```

However, the provided `docker-compose.yml` does **not** define a service named `n8n`.

Therefore this target works only if an existing n8n container/service is reachable from the monitoring network with the DNS name:

```text
n8n
```

For example, you would need to intentionally connect the n8n service to the same Docker network or change the Prometheus target to an address that Prometheus can actually resolve.

Do not assume:

```text
n8n:5678
```

is automatically reachable just because n8n is running somewhere on the host.

### Validate from Prometheus

After startup, check Prometheus targets and confirm the n8n job is actually **UP** before trusting any dashboard panel.

---

## Prometheus Configuration

Current global intervals:

```yaml
scrape_interval: 15s
evaluation_interval: 15s
```

Configured jobs:

- n8n metrics endpoint,
- Prometheus self-monitoring.

The project expects metrics such as:

```text
process_resident_memory_bytes
n8n_active_workflows
bull_queue_waiting
n8n_queue_size
```

### Metric compatibility warning

Metric names can differ across n8n versions, execution modes, and configurations.

The workflow parser and Grafana dashboard should therefore be validated against the **actual output of your own `/metrics` endpoint**.

If a metric is absent, the current parser often falls back to zero. A missing metric can therefore look like a healthy value unless explicit “metric missing” validation is added.

That is an important observability failure mode.

---

## Grafana Dashboard

The included dashboard defines five panels:

| Panel | Query |
|---|---|
| Memory Usage (MB) | `process_resident_memory_bytes / 1024 / 1024` |
| Active Workflows | `n8n_active_workflows` |
| Queue Size | `bull_queue_waiting` |
| Memory Over Time | `process_resident_memory_bytes / 1024 / 1024` |
| Queue Size Over Time | `bull_queue_waiting` |

Default dashboard window:

```text
last 6 hours
```

Refresh interval:

```text
30 seconds
```

### Data-source binding

The dashboard JSON does not provision a Prometheus data source and does not embed a repository-managed provisioning configuration.

After import, verify each panel is actually using the intended Prometheus source.

A stronger setup would provision:

```text
Grafana data source
Grafana dashboard
dashboard folder
```

as code so a fresh deployment does not require manual UI configuration.

---

## Monitoring Workflow

The workflow runs every minute and follows this policy:

```text
fetch metrics
   ↓
parse values
   ↓
memory > 80% ?
   ├─ yes → restart configured worker
   └─ no
       ↓
       queue > 100 ?
       ├─ yes → Slack warning
       └─ no  → healthy
```

### Node summary

| Node | Role |
|---|---|
| `Every Minute` | schedule trigger |
| `Fetch n8n Metrics` | HTTP GET to `N8N_METRICS_URL/metrics` |
| `Parse Metrics` | extracts memory, active workflows, queue size |
| `Memory Critical?` | compares derived memory percentage to 80 |
| `Restart Worker via Docker` | sends container restart request |
| `Log Action` | emits remediation record |
| `Queue Overloaded?` | compares queue size to 100 |
| `Send Warning Alert` | posts Slack webhook |
| `All Healthy` | creates healthy status |
| `Merge Results` | converges branches |
| `Generate Health Report` | emits overall status |

---

## Memory Threshold: What “80%” Actually Means

The current workflow does **not** read the real container memory limit or host memory capacity.

It calculates:

```js
const memoryMB = memoryBytes / (1024 * 1024);
const memoryUsagePercent = Math.min(100, (memoryMB / 512) * 100);
```

So the current “percentage” assumes:

```text
512 MB = 100%
```

This means the 80% threshold is effectively based on roughly:

```text
409.6 MB RSS
```

not 80% of the real machine or container limit.

This is suitable only as a demonstration threshold.

A production implementation should compare memory against an actual resource limit or use container/host metrics from a source such as cAdvisor, Docker metrics, Kubernetes metrics, or another infrastructure collector.

---

## Remediation Target Mismatch Risk

The workflow fetches:

```text
process_resident_memory_bytes
```

from one n8n metrics endpoint, then restarts:

```text
WORKER_CONTAINER_NAME
```

through the Docker API.

These may not represent the same process.

For example:

```text
metrics source = n8n main process
remediation target = n8n worker
```

Restarting a worker because the **main process** is using memory is not a valid causal remediation.

Before automating restarts, metrics must identify the same component that the remediation acts on.

A safer design is:

```text
component-specific metric
        ↓
component-specific threshold
        ↓
evidence that restart is appropriate
        ↓
bounded remediation
        ↓
post-action verification
```

---

## Queue Monitoring

The parser accepts either:

```text
bull_queue_waiting
n8n_queue_size
```

but the Grafana dashboard currently queries only:

```text
bull_queue_waiting
```

If your n8n version exposes only the alternate metric, the workflow and dashboard can disagree.

Normalize one verified metric contract across:

- Prometheus queries,
- Grafana panels,
- n8n parser logic,
- alert rules.

Also consider queue **age**, not only queue **depth**. A queue of 50 old jobs can be more serious than a queue of 150 jobs that drains quickly.

---

## Docker API Security Boundary

The example environment file uses:

```env
DOCKER_API_URL=http://localhost:2375
```

An unauthenticated Docker Engine API is an extremely privileged control surface.

Anyone who can control that API may be able to create privileged containers, mount host paths, access secrets, or effectively control the host.

For that reason:

- do not expose plain Docker API port 2375 publicly,
- do not expose it broadly inside shared networks,
- prefer a tightly scoped Docker socket proxy or dedicated remediation service,
- require authentication/authorization,
- allow only the exact operations needed,
- record every remediation action,
- rate-limit or cool down repeated restarts.

The restart path in this project should be treated as a **controlled-remediation demonstration**, not a production default.

---

## `localhost` in Containerized Deployments

The example environment uses:

```env
N8N_METRICS_URL=http://localhost:5678
DOCKER_API_URL=http://localhost:2375
```

Whether these addresses work depends on where the monitoring workflow executes.

Inside a container:

```text
localhost = that container
```

not automatically the Docker host or another container.

This matters especially in queue mode, where the monitoring workflow may execute on a worker rather than the main n8n process.

Use service DNS names or explicit internal endpoints that match your deployment topology.

---

## Branching Behavior

The current workflow checks queue overload only when the memory threshold is **not** exceeded.

So when memory is high:

```text
restart branch executes
queue overload branch is skipped
```

This means one execution cannot independently report both conditions.

For richer monitoring, calculate all health signals first and then evaluate them independently before selecting actions.

---

## Final Health Report Caveat

The final Code node builds:

```text
actionsTaken
overallStatus
```

from merged branch output.

The Slack warning branch does not explicitly set an `action` field in the same way the healthy and remediation branches do.

As a result, `actionsTaken` can contain incomplete values even though the overall warning state is inferred.

For production observability, standardize all branches to emit the same event schema, for example:

```json
{
  "signal": "queue_depth",
  "state": "warning",
  "action": "slack_alert",
  "value": 143,
  "threshold": 100,
  "timestamp": "..."
}
```

---

## Setup

### 1. Enable n8n metrics

Configure the monitored n8n instance with metrics enabled.

Then verify the endpoint directly:

```bash
curl http://YOUR_N8N_HOST:5678/metrics
```

Do not proceed until you can see the metrics you plan to query.

### 2. Configure environment values

```bash
cp .env.example .env
```

Replace placeholders and, where necessary, replace `localhost` with real internal service addresses.

### 3. Start Prometheus and Grafana

```bash
docker compose up -d
```

Inspect:

```bash
docker compose ps
docker compose logs --tail=100 prometheus
docker compose logs --tail=100 grafana
```

### 4. Validate the Prometheus target

Open Prometheus and confirm the n8n scrape target is reachable.

A running Prometheus container with a **DOWN** n8n target does not provide valid n8n monitoring.

### 5. Configure Grafana

Add Prometheus as a data source:

```text
http://prometheus:9090
```

Then import:

```text
grafana/dashboards/n8n-overview.json
```

Verify every panel resolves against the expected data source and metric names.

### 6. Import the monitoring workflow

Import:

```text
workflows/n8n-infrastructure-monitor.json
```

Before activating remediation, test it with remediation disabled or pointed at a non-production target.

---

## Safer Testing Strategy

Do **not** test worker restart by immediately lowering the threshold against a production worker.

Prefer staged tests:

1. validate metrics parsing,
2. validate missing-metric behavior,
3. validate Slack warning delivery,
4. point remediation at a disposable test container,
5. verify restart request authentication,
6. verify a cooldown prevents restart loops,
7. verify the target returns healthy after restart,
8. only then consider production integration.

---

## Failure Scenarios

| Scenario | Current risk | Production response |
|---|---|---|
| Prometheus cannot reach n8n | dashboard goes empty/stale | alert on scrape health |
| metric name changes | parser may return zero | fail closed on missing required metric |
| main memory high | worker may be restarted incorrectly | component-aware metrics |
| Docker API unavailable | remediation fails | alert + no false success |
| worker repeatedly exceeds threshold | restart loop | cooldown + max attempts |
| Slack webhook fails | warning may be lost | secondary delivery / persisted alert |
| Grafana unavailable | visualization lost | Prometheus alerting remains independent |
| Prometheus unavailable | history + queries lost | monitor the monitor |
| queue high + memory high | queue check skipped | independent signal evaluation |

---

## Security

- Never commit real Slack webhooks, Docker API credentials, or admin passwords.
- Do not expose Grafana or Prometheus directly to the public internet without authentication and TLS.
- Treat Docker control as privileged infrastructure access.
- Prefer least-privilege remediation services over broad Docker Engine access.
- Pin container versions for controlled upgrades.
- Restrict network access between monitoring and production services.
- Protect metrics endpoints when they expose operational metadata.
- Rotate Grafana admin credentials.
- Back up Grafana state if dashboards or configuration are modified through the UI.

---

## Observability Model

A stronger monitoring system would separate four signal types:

```text
Availability
- scrape success
- n8n health
- worker availability

Saturation
- memory
- CPU
- queue depth
- queue age
- worker concurrency

Errors
- workflow failure rate
- retry rate
- provider errors

Latency
- execution duration
- queue wait time
- webhook response latency
```

The current project covers only a subset of those signals.

---

## Production Hardening Roadmap

A production-oriented next version should add:

1. tested, pinned Prometheus and Grafana versions,
2. explicit connectivity between Prometheus and the monitored n8n service,
3. Grafana data-source/dashboard provisioning as code,
4. scrape-health alerting,
5. validation for required metric presence,
6. real container/host memory limits instead of the fixed 512 MB assumption,
7. component-specific worker metrics,
8. queue age and execution latency metrics,
9. independent evaluation of all health signals,
10. standardized health-event schema,
11. authenticated, least-privilege remediation endpoint,
12. restart cooldown and maximum-attempt policy,
13. post-remediation health verification,
14. durable audit log for remediation,
15. alert deduplication and escalation,
16. monitoring of Prometheus/Grafana themselves,
17. load testing and threshold calibration from measured baselines.

---

## Engineering Trade-offs

### Monitoring inside n8n

**Advantage:** easy to orchestrate alerts and remediation with familiar workflow primitives.

**Trade-off:** if n8n itself is severely degraded, a monitoring workflow running inside the same platform may also fail.

For critical monitoring, keep at least one independent external alerting path.

### Automated restart

**Advantage:** can shorten recovery time for a known failure mode.

**Trade-off:** restart is a disruptive action and can hide root causes or create restart loops when the diagnosis is wrong.

### Prometheus + Grafana

**Advantage:** strong separation between metric collection and visualization.

**Trade-off:** the stack is only useful when targets, metric names, retention, and alerts are correctly configured and continuously validated.

---

## Interview Defense

A concise explanation:

> This project demonstrates an observability stack around n8n using Prometheus and Grafana, plus a policy workflow for alerts and remediation. The strongest lesson is that monitoring data and action authority should be separated. The current repository intentionally documents its boundaries: Prometheus connectivity must be wired explicitly, the 80% memory threshold currently assumes a fixed 512 MB baseline, Docker API remediation is privileged, and the metric source must correspond to the component being restarted. A production version would add component-aware metrics, fail-closed metric validation, independent alerting, cooldowns, audit logs, and post-remediation verification.

That explanation is more defensible than presenting the current workflow as autonomous production self-healing.

## License

This project is proprietary and intended for internal use or authorized clients. © 2026.
