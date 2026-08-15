# 21 - AI Resume Screening & Supabase Integration

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This advanced n8n workflow automates the initial stages of the recruitment process. It receives a resume (via Webhook), uses OpenAI's GPT to extract key information, score the candidate, and generate a summary. The structured data is then saved into a Supabase database. If the candidate's score exceeds a predefined threshold (80/100), an automatic alert is sent to the HR team via Slack.


## Nodes Used

- **Webhook**: To receive the incoming resume data/payload.

- **OpenAI**: To analyze the resume text, extract structured JSON data, and score the candidate.

- **Supabase**: To insert the parsed candidate data into the database.

- **IF**: To evaluate the candidate's score and route the workflow.

- **Slack**: To send an instant notification for top-tier candidates.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Trigger**: The workflow starts when a POST request is sent to the Webhook URL containing the resume text.

2. **AI Processing**: The OpenAI node processes the text using a carefully engineered prompt to extract the candidate's name, assign a score (0-100), and write a brief summary. It forces a JSON output format.

3. **Database Storage**: The extracted data is mapped and inserted into the `candidates` table in Supabase.

4. **Conditional Logic**: The IF node checks if the candidate's score is greater than or equal to 80.

5. **Notification**: If the condition is met, the Slack node sends a formatted message to the designated HR channel.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Configure the required credentials (OpenAI, Supabase, Slack).

3. Ensure your Supabase database has the correct table and columns set up.

4. Test the workflow using the "Execute Workflow" button or by sending a POST request to the Webhook URL.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- An active OpenAI API key.

- A Supabase project with a configured database.

- A Slack workspace with permissions to post messages.


## Setup Steps

1. **Supabase Setup**: Create a table named `candidates` with the following columns: `id` (int8, primary key), `name` (text), `score` (int4), `summary` (text), `status` (text), and `created_at` (timestamp).

2. **Credentials**: Add your OpenAI, Supabase (URL and Service Role Key), and Slack credentials in n8n.

3. **Node Configuration**: Update the Slack node with your specific Channel ID.

4. **Activation**: Save and activate the workflow to generate the production Webhook URL.


## Credentials Required

- **OpenAI API**: For accessing GPT models.

- **Supabase API**: Requires the Project URL and the `service_role` key (to bypass RLS if necessary).

- **Slack API**: Requires a Bot Token with `chat:write` permissions.


## Use Cases

- **HR Departments**: Automating the first pass of resume screening to save hours of manual work.

- **Recruitment Agencies**: Quickly filtering high-potential candidates from a large pool of applicants.

- **Talent Acquisition**: Standardizing the evaluation process using AI to reduce unconscious bias.


## Customization Ideas

- **Change Scoring Criteria**: Modify the OpenAI prompt to focus on specific skills (e.g., Python, Project Management).

- **Add Email Trigger**: Replace the Webhook with an IMAP Email node to automatically read resumes from an inbox.

- **PDF Parsing**: Add a binary data extraction node if receiving actual PDF files instead of raw text.

- **Adjust Threshold**: Change the score threshold in the IF node based on your hiring standards.


## Notes

- Ensure the OpenAI model used supports JSON mode for reliable structured output.

- The Supabase `service_role` key is used here for backend operations; ensure your n8n instance is secure.


## Troubleshooting

- **JSON Parsing Error in OpenAI Node**: Ensure the prompt explicitly asks for JSON and that the model temperature is set low (e.g., 0.2).

- **Supabase Insert Fails**: Double-check that the column names in Supabase exactly match the keys in the JSON payload (`name`, `score`, `summary`, `status`). Check Row Level Security (RLS) policies.

- **Slack Message Fails**: Verify the Bot is invited to the target Slack channel.


## License

This project is licensed under the MIT License.
