# Smart LMS Education Automation

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


An intelligent Learning Management System (LMS) automation that personalizes the student journey. It uses AI to assess student levels upon registration, generates tailored learning paths, automatically grades quizzes with personalized feedback, identifies at-risk students for early intervention, and issues digital certificates upon successful completion.


## 🔧 Nodes Used


- **Webhook** - Handles student registration and quiz submissions

- **OpenAI GPT-4** - AI level assessment, personalized quiz grading, and weekly analytics generation

- **Code Node** - Creates learning paths and calculates risk metrics

- **Google Sheets** - Acts as the database for student profiles and progress tracking

- **Switch Node** - Routes students based on quiz performance (Remedial vs. Certificate)

- **Email Send** - Delivers welcome emails, remedial help, certificates, and admin reports

- **Schedule Trigger** - Triggers weekly administrative analytics


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ️ How It Works


### Phase 1: Registration & AI Assessment

1. **Registration Webhook**: Receives new student data and initial quiz answers.

2. **AI Level Assessment**: GPT-4 evaluates the student's background and quiz answers to determine their proficiency level (Beginner, Intermediate, Advanced) and recommends specific modules.

3. **Path Creation & Logging**: The system generates a unique Student ID, saves the profile to the "Students" Google Sheet, and sends a personalized Welcome Email with their first module.


### Phase 2: Quiz Submission & AI Grading

1. **Quiz Webhook**: Triggered when a student submits a module quiz.

2. **AI Grading**: GPT-4 evaluates the answers, assigns a score (0-100), and generates personalized feedback and identifies weak areas.

3. **Risk Check**: The Code Node updates the student's progress and flags them as "at_risk" if their score is below 50%.


### Phase 3: Smart Routing

1. **Switch Node**: Checks the risk flag.

2. **Remedial Path**: If at-risk, the student receives an email with personalized feedback and resources to review the material.

3. **Success Path**: If passed, the student receives a congratulatory email and their digital certificate.


### Phase 4: Weekly Admin Analytics

1. **Scheduled Trigger**: Runs every Monday morning to fetch all student data.

2. **AI Analytics**: GPT-4 analyzes the data to calculate completion rates, identify struggling modules, and generate actionable recommendations for the admin.

3. **Admin Report**: A comprehensive weekly health report is emailed to the course administrator.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Email account (SMTP)


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Webhooks**

   - Copy the production URLs for `Student Registration Webhook` and `Quiz Submission Webhook`.

   - Integrate these URLs into your frontend learning platform or forms.


3. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes.

   - Create a sheet named "Students" with columns: student_id, student_name, email, current_level, current_module_index, status, enrollment_date.


4. **Configure OpenAI**

   - Connect your OpenAI API credentials to all three AI nodes.


5. **Configure Email Notifications**

   - Update `lms@yourcompany.com` (sender) and `admin@yourcompany.com` (weekly reports) with your actual email addresses.


6. **Activate Workflow**

   - Toggle the workflow to "Active".


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **SMTP Email**: Email sending credentials


## 💡 Use Cases


- **Online Course Platforms**: Automate student onboarding, grading, and certification.

- **Corporate Training**: Track employee progress and automatically intervene if they struggle with compliance modules.

- **Coding Bootcamps**: Provide instant, AI-driven feedback on code submissions and quizzes.

- **K-12 Education**: Help teachers identify at-risk students early in the semester.


## 🔧 Customization Ideas


- **PDF Certificate Generation**: Integrate an HTML-to-PDF API (like PDFShift or Gotenberg) to generate and attach a beautifully designed, personalized PDF certificate.

- **Video Hosting Integration**: Connect to Vimeo or YouTube APIs to unlock the next video module only after a quiz is passed.

- **Gamification**: Add a "Points" or "Badges" system in the Code Node to reward students for high scores and streaks.

- **Slack/Teams Integration**: Send real-time notifications to instructors when a student is flagged as "at_risk".


## 📝 Notes


- **Webhook Payloads**: Ensure your frontend sends the correct JSON structure (e.g., `student_name`, `email`, `quiz_answers`) to the webhooks.

- **AI Grading Accuracy**: For highly technical subjects, you may need to adjust the GPT-4 prompt to include specific rubrics or reference materials.


##  Troubleshooting


**Issue**: AI Grading node failing

- **Solution**: Check if the `answers` payload is correctly formatted and not empty. Verify OpenAI API credits.


**Issue**: Student not marked as "at_risk"

- **Solution**: Review the logic in the "Update Progress & Risk Check" Code Node. The threshold is currently set to `< 50`.


**Issue**: Weekly report not sending

- **Solution**: Ensure the "Students" sheet has data and the Schedule Trigger is set to the correct timezone.


##  License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific educational platform needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 18 - Smart LMS Education Automation

**Author**: Koroosh

**Date**: 2026
