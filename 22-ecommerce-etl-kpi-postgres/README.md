# 22 - E-commerce ETL & KPI Dashboard with PostgreSQL

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This advanced n8n workflow implements a daily ETL (Extract, Transform, Load) pipeline for an e-commerce business. It triggers automatically at midnight, fetches raw sales data from an external API, processes and aggregates it using a custom JavaScript script to calculate key performance indicators (KPIs) like Total Revenue, Total Orders, and Average Order Value (AOV). The calculated metrics are then upserted into a PostgreSQL database for historical tracking. Finally, if the daily revenue exceeds a predefined target, a summary report is automatically sent to the management team via Slack.


## Nodes Used

- **Schedule**: Triggers the workflow automatically every day at midnight.

- **HTTP Request**: Extracts raw sales/order data from an external e-commerce API (simulated with JSONPlaceholder).

- **Code**: Transforms and aggregates the raw data to calculate daily KPIs using JavaScript.

- **PostgreSQL**: Loads the calculated KPIs into the database using an Upsert operation to prevent duplicate entries.

- **IF**: Evaluates if the total revenue meets or exceeds the daily target (e.g., $5000).

- **Slack**: Sends a formatted congratulatory message with the KPI summary to a management channel if the target is met.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Extract**: The Schedule node triggers the workflow daily. The HTTP Request node fetches raw data (simulating orders from an e-commerce platform).

2. **Transform**: The Code node receives the array of items, simulates revenue generation, and calculates the Total Revenue, Total Orders, and Average Order Value (AOV). It formats the output with the current date.

3. **Load**: The PostgreSQL node performs an "Upsert" operation, saving the daily KPIs into the `daily_kpi` table. If a record for today already exists, it updates it; otherwise, it creates a new one.

4. **Evaluate & Notify**: The IF node checks if the `total_revenue` is greater than or equal to 5000. If true, the Slack node sends a beautifully formatted message to the designated channel.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up your PostgreSQL database and create the required table.

3. Configure the PostgreSQL and Slack credentials in n8n.

4. Update the HTTP Request URL to point to your actual e-commerce API (e.g., Shopify, WooCommerce).

5. Test the workflow manually using "Execute Workflow" to ensure data flows correctly.

6. Activate the workflow to let it run on the daily schedule.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- A PostgreSQL database server.

- A Slack workspace with a configured Bot.

- (Optional) An actual e-commerce API endpoint for production use.


## Setup Steps

1. **PostgreSQL Setup**: Connect to your database and run the following SQL to create the table:
2. **Credentials**: Add your PostgreSQL connection details (Host, Database, User, Password) and your Slack Bot Token in the n8n Credentials section.

3. **Node Configuration**:

   - Update the `HTTP Request` node with your real API URL and authentication headers.

   - Update the `Slack` node with your specific Management Channel ID.

   - Adjust the revenue target in the `IF` node if needed.

4. **Activation**: Save and activate the workflow.


## Credentials Required

- **PostgreSQL API**: Requires Host, Port, Database Name, User, and Password.

- **Slack API**: Requires a Bot User OAuth Token with `chat:write` permissions.


## Use Cases

- **E-commerce Analytics**: Automating daily sales reporting without manual spreadsheet work.

- **Data Warehousing**: Building a foundational ETL pipeline to feed a larger BI dashboard (like Metabase or Tableau).

- **Performance Tracking**: Automatically alerting management when daily sales targets are crushed.


## Customization Ideas

- **Real API Integration**: Replace the mock HTTP request with actual Shopify, WooCommerce, or Stripe API calls.

- **Advanced Transformations**: Expand the Code node to calculate more complex metrics like Customer Acquisition Cost (CAC) or Conversion Rates.

- **Email Reporting**: Replace or add an SMTP/Gmail node to email the KPI report to stakeholders who don't use Slack.

- **Error Handling**: Add an Error Trigger workflow to notify the tech team if the API fails or the database connection drops.


## Notes

- The `Upsert` operation in PostgreSQL requires a primary key or unique constraint (in this case, `report_date`) to work correctly.

- The JavaScript in the Code node uses mock data for revenue. In a real scenario, you will map actual price/amount fields from your API response.


## Troubleshooting

- **PostgreSQL Upsert Fails**: Ensure the `report_date` column in your database is set as the PRIMARY KEY or has a UNIQUE constraint. Check that the date format matches exactly.

- **Code Node Errors**: Verify that the incoming data structure from the HTTP Request matches what the JavaScript code expects. Use the "Input" tab in the node to inspect the data.

- **Slack Message Not Sending**: Ensure the Slack Bot has been explicitly invited to the target channel (e.g., `/invite @yourbot`).


## License

This project is licensed under the MIT License.
