# Smart Supply Chain & Inventory Management

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


##  Description


An intelligent supply chain and inventory automation system that prevents stockouts and overstocking. It uses AI to forecast weekly demand based on historical data and seasonality, dynamically calculates reorder points, automatically generates Purchase Orders (POs), and routes them for approval based on financial thresholds.


##  Nodes Used


- **Schedule Trigger** - Runs daily inventory checks

- **Google Sheets** - Acts as the database for Inventory and Purchase Orders Log

- **OpenAI GPT-4** - AI demand forecasting and supplier risk analysis

- **Code Node** - Calculates Reorder Points, Safety Stock, and generates PO drafts

- **Switch Node** - Routes POs based on stock status and financial thresholds

- **Email Send** - Automatically sends approved POs to suppliers

- **Slack** - Alerts procurement managers for high-value PO approvals


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Phase 1: Daily Inventory Check & AI Forecasting

1. **Scheduled Trigger**: Runs every morning to fetch current inventory levels from the "Inventory" Google Sheet.

2. **AI Forecasting**: GPT-4 analyzes historical sales, seasonality, and lead times to predict the next 7 days' demand, recommend safety stock, and calculate the exact Reorder Point.


### Phase 2: Reorder Calculation & PO Generation

1. **Code Node**: Compares current stock against the AI-calculated Reorder Point.

2. **PO Draft**: If stock is low, it calculates the optimal order quantity and estimated cost, generating a unique PO Number.


### Phase 3: Smart Routing (Threshold-Based Approval)

1. **Switch Node**: Evaluates the generated PO.

   - **Sufficient Stock**: If no reorder is needed, the process ends.

   - **Auto-Approve**: If the estimated cost is ≤ $5,000, the PO is automatically emailed to the supplier.

   - **Manager Approval**: If the cost is > $5,000, a Slack alert is sent to the procurement manager for manual review.


### Phase 4: Logging

1. **Database Update**: All generated POs (whether auto-approved, sent to manager, or skipped) are logged in the "PurchaseOrdersLog" sheet for audit and tracking.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Email account (SMTP)

- Slack workspace


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Schedule Trigger**

   - Set the cron expression to run at your preferred time (default: 8:00 AM daily).


3. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes.

   - Create two sheets with the following columns:

     - **"Inventory"**: product_name, current_stock, historical_sales, seasonality, lead_time, unit_cost, supplier_email.

     - **"PurchaseOrdersLog"**: po_number, product_name, current_stock, reorder_point, order_quantity, estimated_cost, is_urgent, status, generated_at.


4. **Configure OpenAI**

   - Connect your OpenAI API credentials to the "AI Demand Forecasting" node.


5. **Configure Email & Slack**

   - Update `procurement@yourcompany.com` with your actual sender email.

   - Connect your Slack API and update the channel name (default: `#procurement-alerts`).


6. **Activate Workflow**

   - Toggle the workflow to "Active".


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **SMTP Email**: Email sending credentials

- **Slack API**: Slack Bot Token


## 💡 Use Cases


- **E-commerce Retailers**: Automate restocking for fast-moving consumer goods (FMCG).

- **Manufacturing Plants**: Ensure raw materials are ordered before production lines halt.

- **Restaurant Chains**: Manage perishable inventory and automate orders to food suppliers.

- **Wholesale Distributors**: Handle high volumes of SKUs without manual spreadsheet monitoring.


## 🔧 Customization Ideas


- **ERP Integration**: Replace Google Sheets with HTTP Request nodes to connect directly to SAP, Oracle, or Microsoft Dynamics.

- **Dynamic Safety Stock**: Adjust the Code Node to calculate Safety Stock dynamically based on demand variability (standard deviation).

- **Supplier Performance Tracking**: Add a node to track supplier delivery times and update a "Supplier Reliability Score" in the database.

- **Multi-Currency Support**: Add an exchange rate API node if dealing with international suppliers.


## 📝 Notes


- **AI Prompt Tuning**: The AI forecasting prompt can be enhanced by adding specific industry context (e.g., "Account for upcoming holiday sales spikes").

- **Thresholds**: The $5,000 auto-approval threshold is hardcoded in the Switch Node. Adjust this value based on your company's financial policies.


## 🐛 Troubleshooting


**Issue**: AI Forecasting node failing

- **Solution**: Ensure the "Inventory" sheet contains numeric values for `historical_sales` and `lead_time`.


**Issue**: PO not sent to supplier

- **Solution**: Check the `supplier_email` column in the Inventory sheet and verify SMTP credentials.


**Issue**: Switch node routing incorrectly

- **Solution**: Verify that `estimated_cost` is being calculated as a number in the Code Node, not a string.


##  License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific supply chain needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 19 - Smart Supply Chain & Inventory Management

**Author**: Koroosh

**Date**: 2026
