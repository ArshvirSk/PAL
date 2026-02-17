# Requirements Document: P.A.L. (Personal Assistant for Life on Campus)

## Introduction

P.A.L. is an AI-powered multi-modal web and mobile application designed to transform the engineering college onboarding experience. The system acts as a "Digital Senior" that guides freshers through the complex onboarding process, reduces administrative workload, and facilitates early social integration. The platform serves three primary user groups: incoming students (freshers), college administrators, and faculty mentors.

## Glossary

- **P.A.L.**: Personal Assistant for Life on Campus - the AI-powered onboarding system
- **Fresher**: An incoming first-year engineering student
- **Onboarding_Journey**: The complete process from admission to end of first year, divided into phases
- **Smart_Scan**: AI-powered document verification system using vision AI
- **RAG_System**: Retrieval-Augmented Generation system for contextual query responses
- **Verification_Queue**: Admin interface for reviewing document verification results
- **Sentiment_Monitor**: AI system that analyzes student chat interactions for distress signals
- **Phase**: A distinct stage in the onboarding journey (Docs, Fees, Hostel, Academics)
- **Traffic_Light_Status**: Color-coded verification status (Green=Auto-approved, Yellow=Needs review, Red=Rejected)
- **Knowledge_Base**: Vector database containing college handbooks, rules, and circulars
- **Tribe_Matcher**: Social matching system based on student interests
- **Mentor_Dashboard**: Interface for faculty to monitor assigned student progress

## Requirements

### Requirement 1: Conversational AI Interface

**User Story:** As a fresher, I want to ask questions about campus processes in natural language, so that I can get immediate answers without reading lengthy handbooks.

#### Acceptance Criteria

1. WHEN a student sends a text query via WhatsApp or web interface, THE P.A.L. SHALL respond within 5 seconds with a contextually relevant answer
2. WHEN a student asks a question, THE RAG_System SHALL retrieve information specific to the student's branch and current onboarding phase
3. WHEN a student asks a question in Hindi or English, THE P.A.L. SHALL understand and respond in the same language
4. WHEN the RAG_System cannot find a confident answer, THE P.A.L. SHALL acknowledge uncertainty and offer to connect the student with a human administrator
5. WHEN a student initiates first contact, THE P.A.L. SHALL greet them and guide them to upload their first required document

### Requirement 2: Document Upload and Verification

**User Story:** As a fresher, I want to upload my documents through a simple interface, so that I can complete verification quickly without visiting the office.

#### Acceptance Criteria

1. WHEN a student uploads a PDF or image document, THE Smart_Scan SHALL extract text and structured data using vision AI
2. WHEN the Smart_Scan extracts data, THE System SHALL validate it against the student's admission records
3. IF extracted data matches admission records within acceptable tolerance, THEN THE System SHALL auto-approve the document and mark it with Traffic_Light_Status green
4. IF extracted data shows discrepancies, THEN THE System SHALL flag the document with Traffic_Light_Status yellow and notify both student and admin
5. IF the uploaded document is blurred, corrupted, or appears fraudulent, THEN THE System SHALL reject it with Traffic_Light_Status red and request re-upload
6. WHEN a document is verified, THE System SHALL update the student's Onboarding_Journey progress immediately
7. THE System SHALL accept common document formats including PDF, JPG, PNG, and HEIC

### Requirement 3: Onboarding Progress Dashboard

**User Story:** As a fresher, I want to see my onboarding progress in one place, so that I know exactly what tasks remain and what deadlines are approaching.

#### Acceptance Criteria

1. WHEN a student accesses their dashboard, THE System SHALL display their current Phase and overall completion percentage
2. WHEN displaying the dashboard, THE System SHALL show all tasks for the current Phase with clear status indicators (Complete, In Progress, Not Started, Overdue)
3. WHEN a task has a deadline, THE System SHALL display the deadline prominently and highlight tasks due within 48 hours
4. WHEN a student completes all tasks in a Phase, THE System SHALL automatically unlock the next Phase and send a congratulatory notification
5. THE Dashboard SHALL display a visual progress bar showing completion across all four phases (Docs, Fees, Hostel, Academics)
6. WHEN a student clicks on a task, THE Dashboard SHALL show detailed instructions and required actions

### Requirement 4: Proactive Notifications and Nudges

**User Story:** As a fresher, I want to receive timely reminders about deadlines and important tasks, so that I don't miss critical steps in my onboarding.

#### Acceptance Criteria

1. WHEN a deadline is approaching within 48 hours, THE P.A.L. SHALL send a WhatsApp notification to the student
2. WHEN a student has been inactive for 3 days with pending tasks, THE P.A.L. SHALL send a gentle reminder via their preferred channel
3. WHEN a new circular or announcement is published, THE P.A.L. SHALL notify affected students within 1 hour
4. WHEN a student completes a major milestone, THE P.A.L. SHALL send a congratulatory message
5. THE System SHALL respect notification preferences and allow students to configure quiet hours

### Requirement 5: Social Connection Matching

**User Story:** As a fresher, I want to connect with peers who share my interests, so that I can build friendships and feel less isolated on campus.

#### Acceptance Criteria

1. WHEN a student opts into the Tribe_Matcher, THE System SHALL collect their interests through a brief questionnaire
2. WHEN analyzing interests, THE Tribe_Matcher SHALL identify students with at least 2 common interests in the same hostel block or batch
3. WHEN matches are found, THE P.A.L. SHALL suggest connections with a brief introduction highlighting common interests
4. THE System SHALL require explicit consent from both students before sharing contact information
5. WHEN a student declines a match, THE System SHALL not suggest that same person again
6. THE Tribe_Matcher SHALL prioritize matches within the same hostel block for easier in-person meetups

### Requirement 6: Campus Navigation Assistance

**User Story:** As a fresher, I want visual guidance to find campus locations, so that I don't get lost or miss important appointments.

#### Acceptance Criteria

1. WHEN a student asks for directions to a campus location, THE P.A.L. SHALL provide step-by-step photo-based navigation
2. WHEN providing navigation, THE System SHALL include recognizable landmarks and estimated walking time
3. THE System SHALL maintain a database of all major campus locations including academic buildings, hostels, administrative offices, and facilities
4. WHEN a student has an upcoming appointment or class, THE P.A.L. SHALL proactively offer navigation assistance 15 minutes before

### Requirement 7: Syllabus Context and Career Mapping

**User Story:** As a fresher, I want to understand how my courses relate to real-world careers, so that I can stay motivated and make informed academic choices.

#### Acceptance Criteria

1. WHEN a student views a course in their syllabus, THE System SHALL display career paths and industries where that knowledge is applied
2. WHEN displaying career connections, THE System SHALL include real-world examples and potential job roles
3. THE System SHALL provide visual diagrams showing how courses build upon each other across semesters
4. WHEN a student expresses interest in a specific career, THE System SHALL highlight relevant courses and suggest electives

### Requirement 8: Admin Document Verification Interface

**User Story:** As a college administrator, I want to review flagged documents efficiently, so that I can process verifications quickly without manual data entry.

#### Acceptance Criteria

1. WHEN an administrator accesses the Verification_Queue, THE System SHALL display documents sorted by Traffic_Light_Status (Red first, then Yellow, then Green for audit)
2. WHEN viewing a yellow-flagged document, THE System SHALL display the extracted data alongside the original image with discrepancies highlighted
3. WHEN an administrator approves or rejects a document, THE System SHALL update the student's status with a single click
4. WHEN an administrator rejects a document, THE System SHALL require a brief reason that is automatically sent to the student
5. THE Verification_Queue SHALL display processing metrics including average review time and queue depth
6. WHEN an administrator approves a yellow-flagged document, THE System SHALL learn from the correction to improve future auto-approvals

### Requirement 9: Knowledge Base Management

**User Story:** As a college administrator, I want to update the knowledge base easily, so that students always receive current information without requiring developer intervention.

#### Acceptance Criteria

1. WHEN an administrator uploads a PDF circular or handbook, THE System SHALL automatically extract text and update the Knowledge_Base within 5 minutes
2. WHEN updating the Knowledge_Base, THE System SHALL create vector embeddings and make the content immediately searchable by the RAG_System
3. WHEN an administrator uploads a document, THE System SHALL detect and flag potential duplicates or conflicting information
4. THE System SHALL maintain version history of all uploaded documents with timestamps and uploader information
5. WHEN an administrator marks a document as obsolete, THE System SHALL remove it from active search results but retain it in archives

### Requirement 10: Admin Analytics Dashboard

**User Story:** As a college administrator, I want to see onboarding funnel analytics, so that I can identify bottlenecks and take corrective action.

#### Acceptance Criteria

1. WHEN an administrator accesses the analytics dashboard, THE System SHALL display the number of students in each Phase with completion percentages
2. WHEN displaying analytics, THE System SHALL highlight phases with abnormally high drop-off rates or delays
3. WHEN an administrator identifies a bottleneck, THE System SHALL provide a "Bulk Nudge" button to send WhatsApp reminders to all affected students
4. THE Dashboard SHALL display time-series graphs showing onboarding velocity over the past 30 days
5. THE Dashboard SHALL show the top 10 most frequently asked questions to identify knowledge gaps
6. WHEN an administrator clicks on a phase, THE System SHALL drill down to show individual student statuses and allow filtering by branch or hostel

### Requirement 11: Mentor Monitoring Dashboard

**User Story:** As a faculty mentor, I want to monitor my assigned students' progress and well-being, so that I can provide timely support and intervention.

#### Acceptance Criteria

1. WHEN a mentor accesses their dashboard, THE System SHALL display all assigned students with their current Phase and completion status
2. WHEN displaying student information, THE Mentor_Dashboard SHALL show last activity timestamp and engagement level
3. WHEN a student shows signs of distress or confusion in chat interactions, THE Sentiment_Monitor SHALL flag the student on the Mentor_Dashboard
4. WHEN a student is flagged, THE System SHALL provide context including recent queries and sentiment analysis summary
5. THE Mentor_Dashboard SHALL allow mentors to send direct messages to students through the P.A.L. interface
6. WHEN a student has been inactive for 5 days, THE System SHALL automatically notify their assigned mentor

### Requirement 12: Sentiment Analysis and Well-being Monitoring

**User Story:** As a faculty mentor, I want to be alerted when students show signs of severe distress, so that I can provide support before issues escalate.

#### Acceptance Criteria

1. WHEN a student interacts with P.A.L., THE Sentiment_Monitor SHALL passively analyze message sentiment without storing personal conversation content
2. WHEN sentiment analysis detects severe distress indicators (anxiety, depression, confusion), THE System SHALL assign a severity score
3. IF the severity score exceeds a critical threshold, THEN THE System SHALL immediately alert the assigned mentor with a silent notification
4. THE Sentiment_Monitor SHALL track sentiment trends over time and flag sudden negative changes
5. THE System SHALL maintain student privacy by only sharing sentiment scores and general topics, not full conversation transcripts
6. WHEN a mentor acknowledges an alert, THE System SHALL mark it as reviewed and track response time

### Requirement 13: Multi-Channel Access

**User Story:** As a fresher, I want to access P.A.L. through my preferred communication channel, so that I can get help wherever I'm most comfortable.

#### Acceptance Criteria

1. THE P.A.L. SHALL be accessible via WhatsApp, web browser, and mobile app with consistent functionality
2. WHEN a student switches channels, THE System SHALL maintain conversation context and history
3. WHEN a student sends a voice message via WhatsApp, THE System SHALL transcribe it using speech recognition and respond appropriately
4. THE System SHALL support both Hindi and English voice inputs with automatic language detection
5. WHEN a student uses the web interface, THE System SHALL provide a responsive design that works on mobile and desktop browsers

### Requirement 14: Authentication and Security

**User Story:** As a student, I want my personal information and documents to be secure, so that I can trust the system with sensitive data.

#### Acceptance Criteria

1. WHEN a student first accesses P.A.L., THE System SHALL authenticate them using their admission number and a secure OTP sent to their registered mobile
2. WHEN a student uploads a document, THE System SHALL encrypt it at rest and in transit using industry-standard encryption
3. THE System SHALL implement role-based access control ensuring students can only access their own data
4. WHEN an administrator or mentor accesses student data, THE System SHALL log the access with timestamp and purpose
5. THE System SHALL comply with data retention policies and automatically purge sensitive documents after graduation plus 2 years
6. WHEN a student requests data deletion, THE System SHALL provide a self-service option to delete their account and all associated data

### Requirement 15: System Performance and Reliability

**User Story:** As a user of any role, I want the system to be fast and reliable, so that I can complete my tasks without frustration.

#### Acceptance Criteria

1. WHEN a user performs any action, THE System SHALL respond within 3 seconds under normal load
2. WHEN the system experiences high traffic during peak onboarding periods, THE System SHALL maintain response times under 10 seconds
3. THE System SHALL maintain 99.5% uptime during the critical onboarding period (June-August)
4. WHEN the AI service is temporarily unavailable, THE System SHALL gracefully degrade and queue requests for processing
5. THE System SHALL handle concurrent uploads from 500 students without performance degradation
6. WHEN a user experiences an error, THE System SHALL display a helpful error message and log the issue for debugging

### Requirement 16: Data Integration and APIs

**User Story:** As a system administrator, I want P.A.L. to integrate with existing campus systems, so that data remains synchronized and students don't need to enter information multiple times.

#### Acceptance Criteria

1. THE System SHALL provide REST APIs for integration with existing ERP, LMS, and fee payment systems
2. WHEN a student completes fee payment in the external gateway, THE System SHALL receive a webhook notification and update the student's Phase automatically
3. WHEN student data is updated in the ERP system, THE System SHALL sync changes within 15 minutes
4. THE System SHALL export analytics data in standard formats (CSV, JSON) for institutional reporting
5. WHEN integrating with external systems, THE System SHALL implement retry logic and error handling for failed API calls
6. THE System SHALL maintain an audit log of all data synchronization events

### Requirement 17: Onboarding Phase Management

**User Story:** As a college administrator, I want to configure onboarding phases and tasks, so that the system adapts to our institution's specific processes.

#### Acceptance Criteria

1. WHEN an administrator accesses phase configuration, THE System SHALL allow creation, editing, and deletion of phases
2. WHEN configuring a phase, THE System SHALL allow administrators to define tasks, deadlines, and dependencies
3. WHEN a task has prerequisites, THE System SHALL prevent students from accessing it until prerequisites are complete
4. THE System SHALL support conditional tasks that only apply to specific student segments (e.g., hostel residents vs. day scholars)
5. WHEN an administrator updates phase configuration, THE System SHALL apply changes to all students in that phase without disrupting completed tasks
6. THE System SHALL allow administrators to set phase-specific notification templates

### Requirement 18: Bulk Operations and Student Management

**User Story:** As a college administrator, I want to perform bulk operations on student cohorts, so that I can efficiently manage large-scale onboarding.

#### Acceptance Criteria

1. WHEN an administrator selects multiple students, THE System SHALL provide bulk actions including send notification, reset phase, and export data
2. WHEN performing bulk operations, THE System SHALL process them asynchronously and provide progress updates
3. WHEN a bulk operation completes, THE System SHALL generate a summary report showing successes and failures
4. THE System SHALL allow administrators to filter students by branch, hostel, phase, or completion status before bulk operations
5. WHEN an administrator uploads a CSV of student data, THE System SHALL validate and import records with error reporting

### Requirement 19: Reporting and Compliance

**User Story:** As a college administrator, I want to generate compliance reports, so that I can demonstrate onboarding completion to accreditation bodies.

#### Acceptance Criteria

1. WHEN an administrator requests a compliance report, THE System SHALL generate a PDF showing completion rates by phase and branch
2. THE System SHALL provide pre-built report templates for common institutional requirements
3. WHEN generating reports, THE System SHALL include verification audit trails showing who approved each document and when
4. THE System SHALL allow administrators to schedule automated weekly reports sent via email
5. THE System SHALL maintain historical snapshots of onboarding data for year-over-year comparison

### Requirement 20: Gamification and Engagement

**User Story:** As a fresher, I want to feel motivated and engaged during onboarding, so that the process feels less like a chore and more like an achievement.

#### Acceptance Criteria

1. WHEN a student completes tasks, THE System SHALL award points and display their progress on a leaderboard (opt-in)
2. WHEN a student reaches milestones, THE System SHALL unlock achievement badges displayed on their profile
3. THE System SHALL display encouraging messages and celebrate progress at key completion points
4. WHEN a student helps another student (e.g., through peer matching), THE System SHALL recognize the contribution
5. THE Gamification system SHALL be optional and respect students who prefer a minimal interface
