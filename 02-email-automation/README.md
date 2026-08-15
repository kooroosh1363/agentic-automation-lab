# Exercise 2: Email Automation - Daily Order Processing

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

This workflow automatically processes pending orders from Google Sheets, sends confirmation emails to customers, updates order status, and sends a daily report to Telegram.


## Nodes Used

- Schedule Trigger (runs every 24 hours)

- Google Sheets (Read & Update)

- Filter (Pending orders only)

- Send Email

- Telegram (Report notification)


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Schedule Trigger fires every 24 hours

2. Reads all orders from Google Sheets

3. Filters only "Pending" orders

4. Sends confirmation email to each customer

5. Updates order status to "Sent"

6. Sends a summary report to Telegram


## Google Sheet Structure

Create a sheet named "Orders" with these columns:


| Column | Description |

|--------|-------------|

| order_id | Unique order number |

| customer_name | Customer full name |

| customer_email | Customer email address |

| product | Product name |

| quantity | Number of items |

| total | Order total amount |

| status | Pending / Sent |


## How to Use

1. Import `workflow.json` in n8n

2. Configure Google Sheets and Email credentials

3. Configure Telegram credential

4. Set up your Google Sheet with the required columns

5. Activate the workflow


## Credentials Required

- Google Sheets API

- SMTP (for sending emails)

- Telegram Bot API
