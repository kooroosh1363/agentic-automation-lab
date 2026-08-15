#!/usr/bin/env python3
"""Validate evidence and safety invariants for portfolio projects 24, 48, 49, and 50."""

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
PROJECTS = {
    "24-hvac-field-service-orchestration": "HVAC-",
    "48-etl-data-warehouse": "ETL-",
    "49-ai-ticket-triage": "AI-",
    "50-enterprise-automation-platform": "CAP-",
}
REQUIRED_HEADINGS = [
    "Business Problem",
    "Architecture",
    "Data Flow",
    "Test Cases",
    "Failure Scenarios",
    "Security Considerations",
    "Trade-offs",
    "Production Readiness",
    "Sample Input and Output",
    "Interview Defense Notes",
]


def fail(message: str) -> None:
    ERRORS.append(message)


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"invalid JSON: {path.relative_to(ROOT)}: {exc}")
        return None


def validate_workflow(path: Path) -> dict:
    workflow = load_json(path)
    if not isinstance(workflow, dict):
        return {}
    nodes = workflow.get("nodes")
    connections = workflow.get("connections")
    if not isinstance(nodes, list) or not nodes:
        fail(f"workflow has no nodes: {path.relative_to(ROOT)}")
        return workflow
    if not isinstance(connections, dict):
        fail(f"workflow has no connection graph: {path.relative_to(ROOT)}")
        return workflow
    names = [node.get("name") for node in nodes]
    if len(names) != len(set(names)):
        fail(f"workflow has duplicate node names: {path.relative_to(ROOT)}")
    known = set(names)
    for source, outputs in connections.items():
        if source not in known:
            fail(f"unknown connection source {source}: {path.relative_to(ROOT)}")
        for branches in outputs.values():
            for branch in branches:
                for edge in branch or []:
                    if edge.get("node") not in known:
                        fail(f"unknown connection target {edge.get('node')}: {path.relative_to(ROOT)}")
    return workflow


def node(workflow: dict, name: str) -> dict:
    for item in workflow.get("nodes", []):
        if item.get("name") == name:
            return item
    fail(f"required node missing: {name}")
    return {}


def has_edge(workflow: dict, source: str, target: str) -> bool:
    outputs = workflow.get("connections", {}).get(source, {})
    return any(edge.get("node") == target for branches in outputs.values()
               for branch in branches for edge in (branch or []))


def validate_evidence(project: str, prefix: str) -> None:
    base = ROOT / project
    evidence = base / "docs/engineering-evidence.md"
    if not evidence.exists():
        fail(f"missing engineering evidence: {project}")
        return
    text = evidence.read_text(encoding="utf-8")
    for heading in REQUIRED_HEADINGS:
        if f"## {heading}" not in text:
            fail(f"missing evidence heading '{heading}': {project}")
    for relative in ["examples/sample-input.json", "examples/sample-output.json", "tests/test-cases.json"]:
        if not (base / relative).exists():
            fail(f"missing {relative}: {project}")
    cases = load_json(base / "tests/test-cases.json")
    if not isinstance(cases, list) or len(cases) < 5:
        fail(f"expected at least five test cases: {project}")
    elif any(not case.get("id", "").startswith(prefix) or not case.get("expected") for case in cases):
        fail(f"invalid test-case contract: {project}")
    readme = (base / "README.md").read_text(encoding="utf-8")
    if "## Engineering Evidence" not in readme:
        fail(f"README does not link engineering evidence: {project}")


def validate_project_24() -> None:
    workflow = validate_workflow(ROOT / "24-hvac-field-service-orchestration/workflow.json")
    if not (ROOT / "24-hvac-field-service-orchestration/sql/init.sql").exists():
        fail("project 24 is missing reproducible technician fixtures")
    code = node(workflow, "Code").get("parameters", {}).get("jsCode", "")
    for required in ["$input.all()", "$('Webhook')", "$('OpenAI')", "MANUAL_REVIEW_REQUIRED"]:
        if required not in code:
            fail(f"project 24 dispatch code missing invariant: {required}")
    if "const technicians = [" in code:
        fail("project 24 still contains a hard-coded technician list")
    for source, target in [("PostgreSQL", "Code"), ("Code", "Switch"), ("Google Calendar", "Twilio")]:
        if not has_edge(workflow, source, target):
            fail(f"project 24 missing path: {source} -> {target}")


def validate_project_48() -> None:
    workflow = validate_workflow(ROOT / "48-etl-data-warehouse/workflows/main-etl-pipeline.json")
    for name in ["Normalize & Validate", "Is Valid?", "Upsert to Warehouse", "Send to DLQ", "Final Report"]:
        node(workflow, name)
    if not has_edge(workflow, "Is Valid?", "Send to DLQ"):
        fail("project 48 invalid records do not reach the DLQ")
    validate_workflow(ROOT / "48-etl-data-warehouse/workflows/etl-error-handler.json")


def validate_project_49() -> None:
    workflow = validate_workflow(ROOT / "49-ai-ticket-triage/workflows/ai-ticket-triage.json")
    parse_code = node(workflow, "Parse AI Output").get("parameters", {}).get("jsCode", "")
    approval_code = node(workflow, "Read Approval").get("parameters", {}).get("jsCode", "")
    if "aiOutputValid" not in parse_code or "confidence = parseError" not in parse_code:
        fail("project 49 malformed AI output is not forced to safe confidence")
    if "...original" not in approval_code or "approver" not in approval_code:
        fail("project 49 approval does not preserve context and audit fields")
    for source, target in [("Confident?", "Escalate Low Confidence"), ("Approved?", "Notify Rejection")]:
        if not has_edge(workflow, source, target):
            fail(f"project 49 missing safe path: {source} -> {target}")
    validate_workflow(ROOT / "49-ai-ticket-triage/workflows/triage-error-handler.json")


def validate_project_50() -> None:
    base = ROOT / "50-enterprise-automation-platform/workflows"
    master = validate_workflow(base / "master-orchestrator.json")
    for name in ["Run Intake & Triage", "Run ETL & Warehouse", "Run Fulfillment", "Aggregate Report"]:
        node(master, name)
    etl = validate_workflow(base / "sub-etl-warehouse.json")
    fulfillment = validate_workflow(base / "sub-fulfillment.json")
    validate_workflow(base / "sub-intake-ai-triage.json")
    validate_workflow(base / "global-error-handler.json")
    if not has_edge(etl, "Is Valid?", "Send to DLQ"):
        fail("project 50 invalid data does not reach the DLQ")
    if not has_edge(fulfillment, "Approved?", "Rejected Summary"):
        fail("project 50 rejection path is missing")


def main() -> int:
    for project, prefix in PROJECTS.items():
        validate_evidence(project, prefix)
    validate_project_24()
    validate_project_48()
    validate_project_49()
    validate_project_50()
    if ERRORS:
        print("flagship validation failed:")
        for item in ERRORS:
            print(f"- {item}")
        return 1
    print("flagship validation passed: projects 24, 48, 49, and 50")
    return 0


if __name__ == "__main__":
    sys.exit(main())
