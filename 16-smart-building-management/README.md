# Smart Building Management with IoT

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


##  Description


A comprehensive IoT and smart building automation system that processes real-time sensor data (temperature, humidity, CO2, motion, energy), detects anomalies using AI, automatically adjusts HVAC and lighting systems, triggers emergency alerts, and generates daily analytical reports for facility managers.


## 🔧 Nodes Used


- **Webhook** - Receives real-time data from IoT sensors

- **Code Node** - Enriches sensor data with timestamps and building zones

- **OpenAI GPT-4** - AI anomaly detection and daily report generation

- **Switch Node** - Routes actions based on risk level (Emergency, High Risk, Normal)

- **Telegram** - Sends instant emergency alerts to facility managers

- **HTTP Request** - Communicates with Building Management System (BMS) APIs to adjust HVAC/Lighting

- **Google Sheets** - Logs sensor data and incident reports

- **Schedule Trigger** - Triggers daily analytical reports

- **Email Send** - Delivers daily summary reports


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Phase 1: Real-time Data Ingestion

1. **Sensor Webhook**: Receives JSON payloads from IoT sensors containing environmental and operational data.

2. **Data Enrichment**: The Code Node adds metadata like timestamps, building zones, and determines if it's after working hours.


### Phase 2: AI Analysis & Risk Assessment

1. **Anomaly Detection**: GPT-4 analyzes the enriched data to identify unusual patterns (e.g., sudden temperature spikes, high CO2, unauthorized motion).

2. **Risk Routing**: The Switch Node categorizes the event into three paths:

   - **Emergency**: Critical issues (e.g., fire, gas leak) requiring immediate human intervention.

   - **High Risk**: Significant anomalies requiring automated system adjustments.

   - **Normal**: Routine data logging.


### Phase 3: Automated Response

1. **Emergency Alert**: Sends an urgent Telegram message to the facility manager.

2. **System Adjustment**: Calls the Building Management API to automatically adjust HVAC and lighting based on AI recommendations.

3. **Database Logging**: All events and sensor readings are securely logged in Google Sheets.


### Phase 4: Daily Reporting

1. **Scheduled Trigger**: Runs every morning to fetch the previous day's logs.

2. **AI Report Generation**: GPT-4 analyzes the day's data to calculate averages, identify energy waste, and generate actionable recommendations.

3. **Email Delivery**: A comprehensive daily report is emailed to the management team.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Telegram Bot Token

- Email account (SMTP)

- Access to a Building Management System (BMS) API (or mock API for testing)


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Webhook**

   - Copy the production URL for the `IoT Sensor Webhook`.

   - Use this URL in your IoT devices, MQTT bridge, or testing tools (like Postman) to send JSON payloads.


3. **Configure OpenAI**

   - Connect your OpenAI API credentials to both AI nodes.


4. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID`.

   - Create a sheet named "SensorLogs" with columns: timestamp, sensor_id, zone, temperature, humidity, co2, energy_kwh, motion, risk_level, anomaly_type, hvac_action.


5. **Configure Telegram & Email**

   - Connect your Telegram Bot API and update `YOUR_FACILITY_MANAGER_CHAT_ID`.

   - Update `building-management@yourcompany.com` and `facility-manager@yourcompany.com` with your actual email addresses.


6. **Configure BMS API**

   - Update the `Adjust HVAC & Lighting` HTTP Request node with your actual Building Management API URL and `YOUR_BUILDING_API_KEY`.


7. **Activate Workflow**

   - Toggle the workflow to "Active".


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **Telegram Bot API**: Telegram Bot Token

- **SMTP Email**: Email sending credentials

- **BMS API Key**: API key for your Building Management System


##  Use Cases


- **Commercial Buildings**: Optimize energy usage and maintain comfortable environments.

- **Data Centers**: Monitor server room temperatures and humidity in real-time.

- **Smart Factories**: Track environmental conditions on the production floor.

- **Corporate Offices**: Automate lighting and HVAC based on room occupancy.


## 🔧 Customization Ideas


- **MQTT Integration**: Use an MQTT trigger node instead of Webhooks for direct IoT device communication.

- **Predictive Maintenance**: Train an AI model to predict equipment failures based on historical energy and vibration data.

- **Digital Twin Dashboard**: Connect the Google Sheets data to a tool like Grafana or PowerBI for a real-time 3D building dashboard.

- **Occupancy Tracking**: Integrate with Wi-Fi or Bluetooth beacons to get more accurate room occupancy data.


## 📝 Notes


- **Webhook Payload**: Ensure your IoT devices send a valid JSON payload containing at least `temperature`, `humidity`, `co2`, `motion`, and `energy_kwh`.

- **API Rate Limits**: If you have thousands of sensors, consider batching the data before sending it to the AI node to avoid rate limits and high API costs.

- **Emergency Testing**: Test the emergency routing carefully to ensure critical alerts are never blocked or delayed.


## 🐛 Troubleshooting


**Issue**: Webhook not receiving data

- **Solution**: Ensure the workflow is "Active" and you are using the Production URL, not the Test URL.


**Issue**: AI node returning errors

- **Solution**: Check if the sensor data format matches the prompt expectations. Ensure your OpenAI API key has sufficient credits.


**Issue**: HVAC API call failing (401/403)

- **Solution**: Verify your BMS API token and ensure it has the necessary permissions to adjust settings.


## 📄 License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific smart building needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 16 - Smart Building Management with IoT

**Author**: Koroosh

**Date**: 2026
