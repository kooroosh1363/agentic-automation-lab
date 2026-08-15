# Invoice Processing Automation System

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


An intelligent invoice processing and financial automation system that automatically receives invoices via email, extracts key information using OCR and AI, matches invoices with purchase orders, routes for approval based on matching accuracy, and sends automated payment reminders based on due dates.


## 🔧 Nodes Used


- **Email Trigger (IMAP)** - Monitors inbox for new invoice emails

- **Google Drive** - Stores invoice documents

- **OpenAI GPT-4 Vision** - OCR and invoice data extraction

- **Google Sheets** - Purchase Orders database, Invoice logging

- **Code Node** - Data matching, validation, and payment date checking

- **Switch Node** - Routes invoices based on approval requirements

- **Email Send** - Approval requests and payment reminders

- **Slack** - Auto-approval notifications

- **Schedule Trigger** - Daily payment due date checking


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Main Invoice Processing Flow:

1. **Email Monitoring**: System continuously monitors inbox for invoice emails

2. **Document Storage**: Automatically saves invoice attachments to Google Drive

3. **OCR & AI Extraction**: Uses GPT-4 Vision to extract:

   - Invoice number, dates, vendor information

   - Line items, quantities, unit prices

   - Subtotal, tax, total amount

   - Payment terms and PO number

   - Confidence score for extraction accuracy

4. **Purchase Order Matching**: Compares invoice with POs in Google Sheets:

   - Matches by PO number (if available)

   - Validates vendor name and total amount

   - Calculates match score (0-100%)

5. **Status Determination**:

   - **Auto-Approved**: Match score 100% + OCR confidence ≥90%

   - **Pending Manual Review**: Match score 70-99%

   - **Pending Review**: Match score <70% or no PO match

6. **Approval Routing**:

   - Auto-approved invoices → Slack notification

   - Invoices requiring approval → Email to finance manager

7. **Logging**: All invoices logged in Google Sheets with full details


### Daily Payment Reminder Flow:

1. **Scheduled Check**: Runs daily at 9:00 AM

2. **Due Date Analysis**: Checks all approved invoices

3. **Categorization**:

   - **Overdue Payments**: Due date < today

   - **Upcoming Payments**: Due date within next 3 days

4. **Email Reminder**: Sends consolidated reminder to finance team


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- Email account with IMAP access

- Google Drive account

- Google Sheets account

- OpenAI API key (with Vision access)

- Slack workspace (optional)


### Setup Steps


1. **Import Workflow**

   - Open n8n

   - Click "Import from File"

   - Select `workflow.json`


2. **Configure Email Trigger**

   - Set your email credentials (IMAP server, username, password)

   - Update subject filter if needed (default: "Invoice")


3. **Configure Google Drive**

   - Connect your Google Drive account

   - Update `YOUR_GOOGLE_DRIVE_ID` with your Drive ID

   - Update `YOUR_INVOICES_FOLDER_ID` with target folder ID


4. **Configure OpenAI**

   - Add your OpenAI API credentials

   - Model is set to GPT-4 Vision Preview


5. **Configure Google Sheets**

   - Connect your Google Sheets account

   - Update `YOUR_GOOGLE_SHEET_ID` with your sheet ID

   - Create two sheets:


   **Sheet 1: "PurchaseOrders"** with columns:

   - po_number

   - vendor_name

   - total_amount

   - order_date

   - status


   **Sheet 2: "InvoiceLog"** with columns:

   - invoice_id

   - invoice_number

   - invoice_date

   - due_date

   - vendor_name

   - total_amount

   - currency

   - matched_po

   - match_score

   - confidence_score

   - status

   - requires_approval

   - drive_url

   - received_at

   - processed_at


6. **Configure Slack (Optional)**

   - Connect your Slack account

   - Update channel name (default: #finance-notifications)


7. **Configure Email Notifications**

   - Update email addresses:

     - finance@yourcompany.com (sender)

     - finance-manager@yourcompany.com (approval requests)

     - finance-team@yourcompany.com (payment reminders)


8. **Activate Workflow**

   - Toggle the workflow to "Active"

   - Test by sending an invoice email to your monitored inbox


## 🔐 Credentials Required


- **IMAP Email**: Email server credentials

- **Google Drive OAuth2**: Google Drive API access

- **Google Sheets OAuth2**: Google Sheets API access

- **OpenAI API**: OpenAI API key with Vision access

- **SMTP Email**: Email sending credentials

- **Slack API**: Slack bot token (optional)


## 📊 Matching & Approval Logic


### Match Score Calculation:

- **100%**: PO number matches + Amount matches (±$1) + Vendor matches

- **70%**: Either amount OR vendor matches

- **50%**: PO found but neither amount nor vendor matches

- **0%**: No PO match found


### Approval Requirements:

- **Auto-Approved**: Match score = 100% AND OCR confidence ≥ 90%

- **Manual Review Required**: All other cases


### Status Flow:

1. `pending_review` → Initial status after OCR

2. `auto_approved` → Automatically approved (no manual intervention)

3. `pending_manual_review` → Requires finance manager approval

4. `approved` → Manually approved by finance manager

5. `rejected` → Rejected by finance manager

6. `paid` → Payment completed


## 💡 Use Cases


- **Accounts Payable**: Automate invoice receipt and processing

- **Procurement**: Match invoices with purchase orders automatically

- **Finance Teams**: Streamline approval workflows

- **Small Businesses**: Reduce manual data entry and errors

- **Enterprise**: Handle high volumes of invoices efficiently


## 🔧 Customization Ideas


- Add multi-level approval based on invoice amount thresholds

- Integrate with accounting software (QuickBooks, Xero, SAP)

- Add vendor performance tracking

- Implement duplicate invoice detection

- Add currency conversion for international invoices

- Create dashboard for invoice analytics and cash flow forecasting

- Add automatic payment scheduling

- Integrate with bank APIs for direct payment processing


## 📝 Notes


- OCR quality depends on invoice image clarity and format

- Standard invoice formats yield better extraction results

- Match score thresholds can be adjusted in the Code Node

- Consider adding error handling for failed OCR extractions

- For high volumes, implement queue management

- Test with various invoice formats to ensure robustness


## 🐛 Troubleshooting


**Issue**: OCR extraction failing or inaccurate

- **Solution**: Ensure invoice images are clear and readable; check OpenAI Vision API limits


**Issue**: No purchase order match found

- **Solution**: Verify PO data in Google Sheets; check PO number format consistency


**Issue**: Approval email not sent

- **Solution**: Check SMTP credentials; verify email addresses


**Issue**: Payment reminders not working

- **Solution**: Verify due_date format (YYYY-MM-DD); check Schedule Trigger settings


**Issue**: Auto-approval not triggering

- **Solution**: Check match score calculation logic; verify OCR confidence threshold


## 📄 License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 12 - Invoice Processing Automation

**Author**: Koroosh

**Date**: 2026
