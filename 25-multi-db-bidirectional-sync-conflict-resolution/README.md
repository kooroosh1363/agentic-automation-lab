# 25 - Multi-DB Bidirectional Sync with Conflict Resolution

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This is an enterprise-oriented, multi-step n8n workflow designed to solve one of the most challenging problems in distributed systems: **Bidirectional Data Synchronization with Conflict Resolution** across heterogeneous databases. Built for a multi-branch dental clinic chain, it synchronizes patient data in real-time between PostgreSQL (Central), MySQL (Legacy), and Airtable (Sales). The workflow employs advanced engineering patterns including Hash-based Change Detection, Version Tracking, Anti-Loop Mechanisms, and a multi-strategy Conflict Resolution Algorithm (Last Write Wins + Source Priority). All operations are meticulously logged in an Audit Table for compliance and debugging.


## Nodes Used

- **Webhook**: Receives change events from any of the source systems (PostgreSQL triggers, MySQL binlog listeners, or Airtable automations).

- **Code: Hash & Metadata**: Generates a content hash (checksum) for change detection and attaches synchronization metadata (version, timestamp, anti-loop flag).

- **PostgreSQL: Get Existing**: Fetches the current state of the record from the Central database to compare with incoming changes.

- **Code: Conflict Resolution**: Executes the core decision algorithm: detects race conditions, applies conflict resolution strategies, and determines the action to take.

- **Switch: Routing**: Routes the workflow based on the determined action (propagate, manual review, skip, etc.).

- **PostgreSQL: Update Central**: Writes the winning changes to the Central PostgreSQL database.

- **MySQL: Propagate to Legacy**: Pushes the synchronized data to the Legacy MySQL system.

- **PostgreSQL: Audit Log**: Records every sync operation and conflict in a dedicated audit table.

- **Slack: Conflict Alert**: Notifies the system administrator when a critical data conflict requires manual intervention.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Ingestion**: A change event arrives via Webhook from any source system, containing the `record_id`, `payload_data`, `source_system`, and `timestamp`.

2. **Hash Generation**: The `Code: Hash & Metadata` node generates a content hash to detect actual data changes (not just metadata updates) and increments the sync version.

3. **State Retrieval**: The system queries the Central PostgreSQL database to get the existing record's hash, version, and timestamp.

4. **Conflict Resolution Algorithm**: The `Code: Conflict Resolution` node executes a multi-step decision tree:

   - **Anti-Loop Check**: If the change originated from the sync system itself, it's ignored to prevent infinite loops.

   - **New Record**: If no existing record is found, a full sync is triggered.

   - **Hash Match**: If the content hash matches, the change is skipped (no actual data change).

   - **Race Condition Detection**: If two changes arrive within 5 seconds of each other, a conflict is flagged.

   - **Resolution Strategy**: Applies Source Priority (PostgreSQL > Airtable > MySQL) or Last Write Wins based on timestamps.

5. **Routing**: The Switch node directs the workflow to the appropriate action path.

6. **Propagation**: Changes are written to the Central DB and propagated to Legacy systems.

7. **Audit & Alert**: Every operation is logged. Critical conflicts trigger a Slack alert for manual review.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up all three databases (PostgreSQL, MySQL, Airtable) with the required schema.

3. Configure database triggers or external listeners to send change events to the Webhook.

4. Configure all credentials in n8n.

5. Test with mock data to verify conflict resolution logic.

6. Monitor the `sync_audit_log` table to ensure operations are tracked correctly.

7. Activate the workflow for production use.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- PostgreSQL database (Central system).

- MySQL database (Legacy system).

- Airtable workspace (Sales/Marketing system).

- Slack workspace for conflict alerts.


## Setup Steps

1. **PostgreSQL Setup**: Create the central and audit tables:

   ```sql

   CREATE TABLE central_patients (

       id VARCHAR(50) PRIMARY KEY,

       payload_data JSONB,

       data_hash VARCHAR(50),

       sync_version INT DEFAULT 1,

       last_updated TIMESTAMP DEFAULT NOW(),

       source_of_truth VARCHAR(50)

   );


   CREATE TABLE sync_audit_log (

       id SERIAL PRIMARY KEY,

       record_id VARCHAR(50),

       source_system VARCHAR(50),

       action_taken VARCHAR(50),

       reason TEXT,

       timestamp TIMESTAMP DEFAULT NOW()

   );

2. Set up all three databases (PostgreSQL, MySQL, Airtable) with the required schema.

3. Configure database triggers or external listeners to send change events to the Webhook.

4. Configure all credentials in n8n.

5. Test with mock data to verify conflict resolution logic.

6. Monitor the `sync_audit_log` table to ensure operations are tracked correctly.

7. Activate the workflow for production use.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- PostgreSQL database (Central system).

- MySQL database (Legacy system).

- Airtable workspace (Sales/Marketing system).

- Slack workspace for conflict alerts.


## Setup Steps

1. **PostgreSQL Setup**: Create the central and audit tables:

   ```sql

   CREATE TABLE central_patients (

       id VARCHAR(50) PRIMARY KEY,

       payload_data JSONB,

       data_hash VARCHAR(50),

       sync_version INT DEFAULT 1,

       last_updated TIMESTAMP DEFAULT NOW(),

       source_of_truth VARCHAR(50)

   );


   CREATE TABLE sync_audit_log (

       id SERIAL PRIMARY KEY,

       record_id VARCHAR(50),

       source_system VARCHAR(50),

       action_taken VARCHAR(50),

       reason TEXT,

       timestamp TIMESTAMP DEFAULT NOW()

   );

   ```

2. **MySQL Setup**: Create the legacy table:

   ```sql

   CREATE TABLE legacy_patients (

       id VARCHAR(50) PRIMARY KEY,

       name VARCHAR(100),

       phone VARCHAR(20),

       last_sync TIMESTAMP DEFAULT NOW()

   );

   ```

3. **Airtable Setup**: Create a "Patients" table with matching fields.

4. **Triggers**: Set up database triggers (PostgreSQL `AFTER UPDATE`, MySQL triggers) or application-level hooks to POST to the n8n Webhook whenever data changes.

5. **Credentials**: Add PostgreSQL, MySQL, Airtable, and Slack credentials in n8n.

6. **Node Configuration**: Update all SQL queries and field mappings to match your actual schema.


## Credentials Required

- **PostgreSQL API**: Host, Database, User, Password.

- **MySQL API**: Host, Database, User, Password.

- **Airtable API**: Personal Access Token or API Key.

- **Slack API**: Bot User OAuth Token with `chat:write` permissions.


## Use Cases

- **Multi-Branch Healthcare Clinics**: Synchronizing patient records across different clinic management systems.

- **Retail Chains**: Keeping inventory and customer data consistent across POS, e-commerce, and legacy systems.

- **Mergers & Acquisitions**: Integrating disparate databases after company acquisitions.

- **Legacy System Migration**: Gradually migrating from old systems to new ones while maintaining data consistency.


## Customization Ideas

- **Three-Way Merge**: Implement a more sophisticated merge algorithm that combines changes from multiple fields instead of overwriting.

- **Manual Review UI**: Create a web interface where administrators can manually resolve conflicts flagged by the system.

- **Event Sourcing**: Store all changes as an event log and rebuild state from events for full traceability.

- **CRDTs (Conflict-free Replicated Data Types)**: Replace the custom conflict resolution with CRDTs for eventual consistency without conflicts.

- **Rate Limiting**: Add throttling to prevent overwhelming the databases during bulk updates.


## Notes

- **Anti-Loop Mechanism**: The `is_loopback` flag is critical. When the sync system writes to a database, it must set this flag to `true` to prevent the database trigger from firing another sync event.

- **Hash Algorithm**: The simple hash function in the Code node is for demonstration. For production, consider using MD5 or SHA-256 for better collision resistance.

- **Race Condition Window**: The 5-second window for detecting race conditions is configurable. Adjust based on your network latency and database performance.

- **Idempotency**: The workflow is designed to be idempotent. Running the same change event multiple times will not corrupt data.


## Troubleshooting

- **Infinite Sync Loops**: If you see records updating endlessly, check that the `is_loopback` flag is being set correctly when the sync system writes to databases.

- **Hash Mismatches**: If changes are not being detected, ensure the JSON serialization in the hash function is consistent (key order, formatting).

- **Conflict Resolution Not Working**: Verify that timestamps are in UTC and that all systems are synchronized via NTP.

- **Audit Log Not Populating**: Check that the `sync_audit_log` table exists and the INSERT query has correct column names.

- **Slack Alerts Not Sending**: Ensure the Slack Bot is invited to the target channel and has the correct permissions.


## License

This project is licensed under the MIT License
