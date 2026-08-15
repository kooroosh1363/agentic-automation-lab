# 24 - HVAC Field Service Orchestration & Dynamic Dispatch

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This is an enterprise-oriented, multi-component n8n workflow designed for Field Service Management (FSM) in the HVAC and home appliance industry. It automates the entire dispatch lifecycle: from receiving a service request to assigning the optimal technician. The workflow uses AI to parse the issue, queries a database for active technicians, and runs a custom JavaScript scoring algorithm (incorporating the Haversine distance formula, skill matching, van inventory checks, and current workload). Based on the outcome, it dynamically calculates the service price, books a Google Calendar slot, sends an SMS confirmation via Twilio, or triggers a fallback alert to the dispatch manager if no suitable technician is found.


## Nodes Used

- **Webhook**: Receives the incoming service request payload (customer details, address, coordinates, issue description).

- **OpenAI**: Analyzes the unstructured issue description to extract `device_type`, `issue_summary`, `required_parts` (array), and `urgency` level in strict JSON format.

- **PostgreSQL**: Fetches the list of active technicians, including their coordinates, skills, current workload, and van inventory.

- **Code**: Executes a custom JavaScript algorithm to score each technician based on proximity, parts availability, and workload, then selects the best match and calculates a dynamic price.

- **Switch**: Routes the workflow based on whether a suitable technician with available parts was found.

- **Google Calendar**: Automatically reserves a service time slot in the assigned technician's calendar.

- **Twilio**: Sends a personalized SMS confirmation to the customer with technician details and estimated price.

- **Slack**: Acts as a fallback mechanism, alerting the dispatch manager if manual intervention is required (e.g., no matching technician or missing parts).


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Ingestion**: A POST request hits the Webhook with customer and issue data.

2. **AI Triage**: OpenAI parses the issue, identifying the device, required parts, and urgency.

3. **Data Retrieval**: PostgreSQL returns an array of all active technicians and their current state.

4. **Advanced Scoring (Code Node)**:

   - Calculates the geographical distance between the customer and each technician using the Haversine formula.

   - Checks if the technician's `van_inventory` contains all `required_parts`.

   - Applies a weighted scoring model: 40% Proximity, 40% Parts Availability, 20% Inverse Workload.

   - Selects the technician with the highest score.

   - Calculates a dynamic price: Base Price (based on urgency) + Travel Fee (distance-based) + Parts Fee.

5. **Decision Routing**: The Switch node checks if a valid technician was assigned and parts are available.

6. **Success Path**: Google Calendar creates an event, and Twilio sends an SMS to the customer.

7. **Fallback Path**: If no match is found, Slack notifies the dispatch manager for manual resolution or parts ordering.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up the PostgreSQL database with the `technicians` table and sample data.

3. Configure all required credentials (OpenAI, PostgreSQL, Google Calendar, Twilio, Slack).

4. Test the workflow by sending a mock POST request to the Webhook URL.

5. Monitor the execution to verify the scoring logic and routing.

6. Activate the workflow for production use.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- An active OpenAI API key.

- A PostgreSQL database.

- A Google Cloud project with Google Calendar API enabled.

- A Twilio account with an active phone number.

- A Slack workspace with a dedicated dispatch channel.


## Setup Steps

1. **PostgreSQL Setup**: Create the `technicians` table and insert sample data:

   ```sql

   CREATE TABLE technicians (

       id VARCHAR(50) PRIMARY KEY,

       name VARCHAR(100),

       lat DECIMAL(9,6),

       lon DECIMAL(9,6),

       skills TEXT[], -- e.g., {'AC', 'Heater'}

       current_load INT,

       van_inventory TEXT[], -- e.g., {'freon', 'compressor'}

       status VARCHAR(20)

   );

   INSERT INTO technicians (id, name, lat, lon, skills, current_load, van_inventory, status)

   VALUES ('TECH-001', 'Sample Technician', 35.70, 51.40, '{"AC", "Heater"}', 2, '{"freon", "thermostat"}', 'active');


Credentials: Add your OpenAI, PostgreSQL, Google Calendar (OAuth2), Twilio, and Slack credentials in n8n.

Node Configuration:

Update the Twilio node with your actual fromNumber and the customer's toNumber (mapped from the webhook).

Update the Google Calendar node with the correct calendar ID.

Adjust the scoring weights in the Code node if your business logic requires different priorities.

Activation: Save and activate the workflow.

Credentials Required

OpenAI API: For GPT-4o structured data extraction.

PostgreSQL API: Database connection details.

Google Calendar OAuth2: For event creation.

Twilio API: Account SID and Auth Token.

Slack API: Bot User OAuth Token with chat:write permissions.

Use Cases

HVAC & Plumbing Companies: Automating dispatch to reduce response times and fuel costs.

Appliance Repair Services: Ensuring technicians arrive with the correct parts on the first visit (First-Time Fix Rate).

IT Field Services: Dispatching specialized technicians for on-site hardware repairs.

Customization Ideas

Real-Time Traffic: Integrate Google Maps Distance Matrix API in the Code node or via an HTTP Request node to use actual driving time instead of straight-line distance.

Customer Portal: Add a webhook response that returns a tracking link to the customer.

Inventory Management: If parts are missing, automatically trigger an HTTP Request to a supplier's API to order the required parts before notifying the manager.

Technician App: Replace Google Calendar with a custom mobile app API to push notifications directly to the technician's phone.

Notes

The Code node contains a mock array of technicians for demonstration purposes. In a production environment, you should map the $input.all() from the PostgreSQL node directly into the scoring algorithm.

The Haversine formula in the Code node calculates straight-line distance. For urban dispatch, driving distance via a routing API is more accurate.

The dynamic pricing model is a simplified example. Real-world pricing may require fetching official part prices from a database.

Troubleshooting

OpenAI JSON Parse Error: Ensure the system prompt strictly enforces JSON output. Check the responseFormat setting in the OpenAI node.

Code Node Returns Null: Verify that the customer_lat and customer_lon are provided as numbers in the Webhook payload.

Google Calendar Fails: Ensure the Google service account or OAuth user has "Make changes to events" permission on the target calendar.

Twilio SMS Fails: Check that the destination phone number is in E.164 format (e.g., +15550100000) and that your Twilio account has sufficient balance.

License

This project is licensed under the MIT License.

## Engineering Evidence

The portfolio evidence for this project is intentionally separated from the setup guide:

- [Business problem, architecture, data flow, security, trade-offs, and production readiness](docs/engineering-evidence.md)
- [Sample input](examples/sample-input.json) and [sample output](examples/sample-output.json)
- [Test and failure scenarios](tests/test-cases.json)
- [Reproducible PostgreSQL technician schema and sample fixtures](sql/init.sql)

The workflow now scores the technicians returned by PostgreSQL instead of a hard-coded technician list. The documentation clearly distinguishes implemented behavior from production follow-up work.
