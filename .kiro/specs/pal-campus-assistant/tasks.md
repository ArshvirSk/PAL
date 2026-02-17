# Implementation Plan: P.A.L. (Personal Assistant for Life on Campus)

## Overview

This implementation plan focuses on building the backend services and API layer to power the existing Next.js frontend. The UI is already built with a minimal futuristic design featuring soft neumorphism, gradient line art, and clean spacing. The frontend includes pages for dashboard, chat, documents, tribe matching, and admin control.

The implementation uses TypeScript with Node.js for backend services, integrates with Google Gemini for AI capabilities, and connects to the existing Next.js frontend through REST APIs. The focus is on creating functional backend services that bring the beautiful UI to life with real AI-powered features.

**Design Aesthetic**: Minimal futuristic UI with soft neumorphism, gradient line art, high-contrast black/white alternation, circular floating buttons, geometric sans-serif typography, and calm intelligence expression.

## Tasks

- [x] 1. Project setup and infrastructure
  - Initialize monorepo with TypeScript, set up database schemas, configure development environment
  - Create PostgreSQL database with Supabase
  - Set up ChromaDB for vector storage
  - Configure environment variables and secrets management
  - Set up basic API gateway with Express.js
  - _Requirements: 15.1, 16.1_

- [x] 2. Implement core data models and database layer
  - [x] 2.1 Create database schema and migrations
    - Write SQL migrations for all tables (users, documents, tasks, conversations, messages, interests, matches, alerts, notifications)
    - Implement database connection pooling and transaction management
    - Create database indexes for performance optimization
    - _Requirements: 14.3, 15.1_

  - [x] 2.2 Implement TypeScript data models and repositories
    - Create TypeScript interfaces for all entities (User, Document, Task, Conversation, etc.)
    - Implement repository pattern for database access
    - Add data validation using Zod schemas
    - _Requirements: 14.3, 15.1_

  - [ ]* 2.3 Write property test for data model validation
    - **Property 46: Role-Based Access Control**
    - **Validates: Requirements 14.3**

- [x] 3. Implement User Service and authentication
  - [x] 3.1 Create user authentication with OTP
    - Implement OTP generation and verification using Supabase Auth
    - Create JWT token generation and validation
    - Build login/logout endpoints
    - _Requirements: 14.1, 14.3_

  - [x] 3.2 Implement user profile and progress management
    - Create endpoints for getting user profile
    - Implement progress calculation logic (weighted by task importance)
    - Build phase transition logic with automatic advancement
    - _Requirements: 3.1, 3.4_

  - [ ]* 3.3 Write property test for phase transition
    - **Property 8: Phase Transition Automation**
    - **Validates: Requirements 3.4**

  - [ ]* 3.4 Write property test for progress calculation
    - **Property 7: Dashboard Data Completeness**
    - **Validates: Requirements 3.1, 3.2**

- [x] 4. Implement task management system
  - [x] 4.1 Create task definition and user task models
    - Implement CRUD operations for task definitions
    - Build task assignment logic for new users
    - Create dependency graph validation (DAG)
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 4.2 Implement task dependency enforcement
    - Build logic to check prerequisite completion
    - Create task unlocking mechanism
    - Implement conditional task applicability
    - _Requirements: 17.3, 17.4_

  - [ ]* 4.3 Write property test for task dependencies
    - **Property 57: Task Dependency Enforcement**
    - **Validates: Requirements 17.3**

  - [ ]* 4.4 Write property test for conditional tasks
    - **Property 58: Conditional Task Applicability**
    - **Validates: Requirements 17.4**

- [x] 5. Checkpoint - Ensure core data layer works
  - Ensure all tests pass, verify database operations, ask the user if questions arise.

- [-] 6. Implement Document Service and Vision AI
  - [x] 6.1 Create document upload endpoint
    - Build file upload handler with multipart/form-data support
    - Implement file validation (size, format, mime type)
    - Store files in Supabase Storage with encryption
    - _Requirements: 2.1, 14.2_

  - [x] 6.2 Integrate Google Cloud Vision API for OCR
    - Set up Google Cloud Vision API client
    - Implement document preprocessing (rotation, contrast enhancement)
    - Build field extraction logic with regex patterns for each document type
    - Create quality assessment (blur detection, resolution check)
    - _Requirements: 2.1, 2.5_

  - [ ] 6.3 Implement document verification workflow
    - Build validation logic comparing extracted data to admission records
    - Implement traffic light classification (green/yellow/red)
    - Create async job queue using Bull for document processing
    - Send notifications to students and admins based on status
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 6.4 Write property test for document classification
    - **Property 5: Document Classification Correctness**
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 6.5 Write property test for progress updates
    - **Property 6: Progress Update Atomicity**
    - **Validates: Requirements 2.6**

  - [ ]* 6.6 Write unit tests for document upload edge cases
    - Test invalid file formats, oversized files, corrupted images
    - Test extraction failures and quality issues
    - _Requirements: 2.5, 2.7_

- [ ] 7. Implement RAG Engine with LangChain and Gemini
  - [ ] 7.1 Set up ChromaDB vector database
    - Initialize ChromaDB collection for knowledge base
    - Configure embedding function (text-embedding-004)
    - Create document indexing pipeline
    - _Requirements: 1.2, 9.1_

  - [ ] 7.2 Implement document chunking and embedding
    - Build semantic chunking logic (512 tokens, 50 token overlap)
    - Generate embeddings for document chunks
    - Store chunks with metadata (branch, phase, document type)
    - _Requirements: 9.1, 9.2_

  - [ ] 7.3 Build RAG query pipeline with LangChain
    - Implement tiered context retrieval (user → branch → general)
    - Build MMR retrieval for diversity (top-5 chunks)
    - Create prompt template with system role and context
    - Integrate Google Gemini 1.5 Pro for response generation
    - Implement citation tracking
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 7.4 Write property test for context-aware retrieval
    - **Property 1: Context-Aware RAG Retrieval**
    - **Validates: Requirements 1.2**

  - [ ]* 7.5 Write property test for low confidence escalation
    - **Property 3: Low Confidence Escalation**
    - **Validates: Requirements 1.4**

- [ ] 8. Implement Chat Service
  - [ ] 8.1 Create conversation and message management
    - Build conversation creation and retrieval
    - Implement message storage with sentiment scores
    - Create conversation context management in Redis
    - _Requirements: 1.1, 12.1_

  - [ ] 8.2 Build chat API endpoints
    - Create POST /chat/message endpoint
    - Implement GET /chat/history endpoint
    - Add WebSocket support for real-time chat
    - Integrate with RAG engine for responses
    - _Requirements: 1.1, 1.5_

  - [ ] 8.3 Implement language detection and consistency
    - Add language detection for incoming messages
    - Ensure response language matches input language
    - Support Hindi and English
    - _Requirements: 1.3_

  - [ ]* 8.4 Write property test for language consistency
    - **Property 2: Language Consistency**
    - **Validates: Requirements 1.3**

  - [ ]* 8.5 Write property test for multi-channel consistency
    - **Property 41: Multi-Channel Consistency**
    - **Validates: Requirements 13.1**

- [ ] 9. Checkpoint - Verify AI services integration
  - Ensure all tests pass, verify RAG responses and document OCR work correctly, ask the user if questions arise.

- [ ] 10. Implement Notification Service
  - [ ] 10.1 Set up Twilio integration for WhatsApp
    - Configure Twilio WhatsApp Business API
    - Implement webhook handler for incoming WhatsApp messages
    - Create message sending function
    - _Requirements: 4.1, 13.1_

  - [ ] 10.2 Build notification queue and delivery system
    - Implement Bull queue for notification processing
    - Create notification templates with Handlebars
    - Build multi-channel delivery (WhatsApp, SMS, email, push)
    - Implement priority queues and rate limiting
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 10.3 Implement notification preferences and quiet hours
    - Create user preference management
    - Build quiet hours enforcement logic
    - Implement notification queuing during quiet hours
    - _Requirements: 4.5_

  - [ ]* 10.4 Write property test for event-based notifications
    - **Property 10: Event-Based Notification Triggering**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 10.5 Write property test for quiet hours enforcement
    - **Property 11: Quiet Hours Enforcement**
    - **Validates: Requirements 4.5**

- [ ] 11. Implement Sentiment Analysis Service
  - [ ] 11.1 Set up sentiment analysis model
    - Integrate Hugging Face Transformers (multilingual BERT)
    - Create sentiment scoring function
    - Implement emotion detection and distress indicator extraction
    - _Requirements: 12.1, 12.2_

  - [ ] 11.2 Build sentiment monitoring and alerting
    - Implement passive sentiment analysis on messages
    - Create 7-day rolling average calculation
    - Build alert triggering logic for high severity
    - Send silent notifications to mentors
    - _Requirements: 11.3, 12.3, 12.4_

  - [ ] 11.3 Implement privacy-preserving storage
    - Store only sentiment scores, not message content
    - Create context summarization without exposing transcripts
    - _Requirements: 12.1, 12.5_

  - [ ]* 11.4 Write property test for privacy preservation
    - **Property 36: Privacy-Preserving Sentiment Analysis**
    - **Validates: Requirements 12.1, 12.5**

  - [ ]* 11.5 Write property test for sentiment-based flagging
    - **Property 33: Sentiment-Based Flagging**
    - **Validates: Requirements 11.3**

- [ ] 12. Implement Social Service (Tribe Matcher)
  - [ ] 12.1 Create interest collection and storage
    - Build interest submission endpoint
    - Store interests with categories and tags
    - _Requirements: 5.1_

  - [ ] 12.2 Implement matching algorithm
    - Calculate Jaccard similarity for interest overlap
    - Compute proximity scores (hostel, batch, branch)
    - Generate weighted match scores (40% interest + 30% proximity + 30% engagement)
    - _Requirements: 5.2, 5.6_

  - [ ] 12.3 Build match suggestion and consent flow
    - Create match suggestion endpoint
    - Implement accept/decline/maybe_later responses
    - Build mutual consent logic for contact sharing
    - Generate icebreaker messages using LLM
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 12.4 Write property test for match criteria
    - **Property 12: Match Criteria Enforcement**
    - **Validates: Requirements 5.2, 5.6**

  - [ ]* 12.5 Write property test for consent enforcement
    - **Property 14: Consent-Based Contact Sharing**
    - **Validates: Requirements 5.4**

  - [ ]* 12.6 Write property test for decline permanence
    - **Property 15: Decline Permanence**
    - **Validates: Requirements 5.5**

- [ ] 13. Implement Admin Service
  - [ ] 13.1 Create verification queue interface
    - Build queue retrieval with filtering and sorting
    - Implement priority scoring (red > yellow > green, older > newer)
    - Create admin review endpoints (approve/reject)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 13.2 Build knowledge base management
    - Create PDF upload and parsing endpoint
    - Implement automatic chunking and vectorization
    - Build duplicate detection logic
    - Create version history tracking
    - Handle obsolete document marking
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 13.3 Implement analytics dashboard backend
    - Calculate funnel metrics (students per phase, completion rates)
    - Detect bottlenecks (high drop-off, long completion times)
    - Generate top FAQ analytics from query logs
    - Build time-series data aggregation
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ] 13.4 Create bulk operations system
    - Implement bulk notification sending
    - Build async processing with progress tracking
    - Create CSV import with validation
    - Generate operation summary reports
    - _Requirements: 10.3, 18.1, 18.2, 18.3, 18.5_

  - [ ]* 13.5 Write property test for verification queue sorting
    - **Property 20: Verification Queue Sorting**
    - **Validates: Requirements 8.1**

  - [ ]* 13.6 Write property test for knowledge base searchability
    - **Property 24: Knowledge Base Searchability**
    - **Validates: Requirements 9.2**

  - [ ]* 13.7 Write property test for bulk operation reporting
    - **Property 61: Bulk Operation Reporting**
    - **Validates: Requirements 18.3**

- [ ] 14. Checkpoint - Verify admin and social features
  - Ensure all tests pass, verify admin workflows and social matching work correctly, ask the user if questions arise.

- [ ] 15. Implement Mentor Dashboard Service
  - [ ] 15.1 Create mentor dashboard backend
    - Build endpoint to get assigned students
    - Implement student status aggregation
    - Create alert retrieval and acknowledgment
    - _Requirements: 11.1, 11.2, 11.4, 11.6_

  - [ ] 15.2 Implement inactivity monitoring
    - Create background job to detect 5-day inactivity
    - Send alerts to assigned mentors
    - _Requirements: 11.6_

  - [ ]* 15.3 Write property test for mentor dashboard completeness
    - **Property 32: Mentor Dashboard Completeness**
    - **Validates: Requirements 11.1, 11.2**

  - [ ]* 15.4 Write property test for inactivity alerts
    - **Property 35: Inactivity Alert**
    - **Validates: Requirements 11.6**

- [ ] 16. Implement external system integrations
  - [ ] 16.1 Create webhook handlers for external systems
    - Build webhook receiver for fee gateway
    - Implement signature validation
    - Create ERP sync endpoint
    - Build LMS integration
    - _Requirements: 16.2, 16.3_

  - [ ] 16.2 Implement retry logic and error handling
    - Build exponential backoff retry mechanism
    - Create dead letter queue for failed webhooks
    - Implement sync audit logging
    - _Requirements: 16.5, 16.6_

  - [ ]* 16.3 Write property test for webhook processing
    - **Property 53: Webhook Processing**
    - **Validates: Requirements 16.2**

  - [ ]* 16.4 Write property test for API retry logic
    - **Property 55: API Retry Logic**
    - **Validates: Requirements 16.5**

- [ ] 17. Implement security and access control
  - [ ] 17.1 Add role-based access control middleware
    - Create RBAC middleware for API routes
    - Implement permission checking (student/admin/mentor roles)
    - Add resource ownership validation
    - _Requirements: 14.3_

  - [ ] 17.2 Implement audit logging
    - Create audit log for all data access
    - Log admin and mentor actions
    - Track data modifications with timestamps
    - _Requirements: 14.4_

  - [ ] 17.3 Add encryption for sensitive data
    - Implement AES-256 encryption for documents at rest
    - Ensure TLS 1.3 for all API communications
    - _Requirements: 14.2_

  - [ ]* 17.4 Write property test for access control
    - **Property 46: Role-Based Access Control**
    - **Validates: Requirements 14.3**

  - [ ]* 17.5 Write property test for audit logging
    - **Property 47: Access Audit Logging**
    - **Validates: Requirements 14.4**

- [ ] 18. Connect frontend to backend APIs
  - [ ] 18.1 Create API client utilities
    - Build axios-based API client with interceptors
    - Implement authentication token management
    - Add error handling and retry logic
    - Create TypeScript types for API responses
    - _Requirements: 16.1, 14.1_

  - [ ] 18.2 Connect dashboard page to User Service
    - Fetch user profile and progress data
    - Display real-time phase and task status
    - Update UI when tasks complete
    - Show notifications from backend
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 18.3 Connect documents page to Document Service
    - Implement real file upload to backend
    - Show real-time verification status updates
    - Display extracted data from Vision AI
    - Handle upload errors and retries
    - _Requirements: 2.1, 2.6, 2.3, 2.4, 2.5_

  - [ ] 18.4 Connect chat page to Chat Service
    - Implement WebSocket connection for real-time chat
    - Send messages to RAG engine
    - Display AI responses with sources
    - Handle language detection
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 18.5 Connect tribe page to Social Service
    - Fetch interest-based matches
    - Submit user interests
    - Handle connection requests
    - Display match scores and common interests
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 18.6 Connect admin page to Admin Service
    - Fetch verification queue with filters
    - Implement approve/reject actions
    - Display analytics and funnel data
    - Handle bulk operations
    - _Requirements: 8.1, 8.3, 10.1, 10.3_

  - [ ]* 18.7 Write integration tests for frontend-backend connection
    - Test API client error handling
    - Test authentication flow
    - Test real-time updates
    - _Requirements: 14.1, 15.1_

- [ ] 20. Implement additional features
  - [ ] 20.1 Add campus navigation assistance
    - Create location database
    - Build step-by-step navigation generator
    - Implement proactive navigation offers
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 20.2 Implement syllabus and career mapping
    - Create course-career mapping database
    - Build career path display
    - Implement course recommendation based on career interest
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 20.3 Add gamification system
    - Implement point award system
    - Create achievement badge logic
    - Build leaderboard
    - Add milestone celebration messages
    - Implement opt-out preference
    - _Requirements: 20.1, 20.2, 20.3, 20.5_

  - [ ]* 20.4 Write property test for gamification points
    - **Property 66: Gamification Point Award**
    - **Validates: Requirements 20.1**

- [ ] 21. Implement voice message support
  - [ ] 21.1 Integrate OpenAI Whisper for transcription
    - Set up Whisper API client
    - Implement audio file processing
    - Add language detection (Hindi/English)
    - _Requirements: 13.3, 13.4_

  - [ ]* 21.2 Write property test for voice transcription
    - **Property 43: Voice Message Transcription**
    - **Validates: Requirements 13.3**

- [ ] 22. Add reporting and compliance features
  - [ ] 22.1 Implement compliance report generation
    - Create PDF generation with completion rates
    - Include verification audit trails
    - Add institutional metadata
    - _Requirements: 19.1, 19.3_

  - [ ] 22.2 Build scheduled report system
    - Implement weekly report scheduling
    - Create email delivery
    - _Requirements: 19.4_

  - [ ] 22.3 Create historical snapshot system
    - Build end-of-month snapshot creation
    - Store historical data for comparison
    - _Requirements: 19.5_

- [ ] 23. Implement data retention and deletion
  - [ ] 23.1 Add data retention policies
    - Create background job for automatic purging
    - Implement graduation + 2 years logic
    - _Requirements: 14.5_

  - [ ] 23.2 Build self-service data deletion
    - Create account deletion endpoint
    - Implement complete data removal
    - _Requirements: 14.6_

  - [ ]* 23.3 Write property test for data deletion completeness
    - **Property 49: Data Deletion Completeness**
    - **Validates: Requirements 14.6**

- [ ] 24. Performance optimization and error handling
  - [ ] 24.1 Implement caching strategy
    - Add Redis caching for user profiles
    - Cache RAG responses for common queries
    - Implement cache invalidation logic
    - _Requirements: 15.1_

  - [ ] 24.2 Add graceful degradation for AI services
    - Implement circuit breaker pattern
    - Create fallback responses
    - Build request queuing for service recovery
    - _Requirements: 15.4_

  - [ ] 24.3 Implement comprehensive error handling
    - Create consistent error response format
    - Add user-friendly error messages
    - Implement error logging with request IDs
    - _Requirements: 15.6_

  - [ ]* 24.4 Write property test for response time
    - **Property 50: Response Time Performance**
    - **Validates: Requirements 15.1**

  - [ ]* 24.5 Write property test for graceful degradation
    - **Property 51: Graceful Degradation**
    - **Validates: Requirements 15.4**

- [ ] 25. Final integration and testing
  - [ ] 25.1 Run all property-based tests
    - Execute all 69 property tests with 100 iterations each
    - Fix any failing properties
    - Document any edge cases discovered

  - [ ] 25.2 Perform end-to-end testing
    - Test complete student onboarding flow
    - Test admin verification workflow
    - Test mentor monitoring workflow
    - Test social matching flow

  - [ ] 25.3 Load testing and performance validation
    - Test with 500 concurrent users
    - Verify response times under load
    - Test document upload concurrency

- [ ] 26. Final checkpoint - Production readiness
  - Ensure all tests pass, verify all features work end-to-end, test the UI with real backend data, prepare demo scenarios, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for course correction
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation prioritizes core functionality (authentication, document verification, RAG chat) before advanced features (gamification, voice support)
- **The frontend UI is already built** - focus on backend services and API integration
- **Design aesthetic**: Maintain the minimal futuristic style with soft neumorphism, gradient accents, and clean spacing
- For hackathon execution, focus on tasks 1-18 for a functional MVP with connected frontend, then add tasks 19-23 as time permits


- [ ] 18. Connect frontend to backend APIs
  - [ ] 18.1 Create API client utilities
    - Build axios-based API client with interceptors
    - Implement authentication token management
    - Add error handling and retry logic
    - Create TypeScript types for API responses
    - _Requirements: 16.1, 14.1_

  - [ ] 18.2 Connect dashboard page to User Service
    - Fetch user profile and progress data
    - Display real-time phase and task status
    - Update UI when tasks complete
    - Show notifications from backend
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 18.3 Connect documents page to Document Service
    - Implement real file upload to backend
    - Show real-time verification status updates
    - Display extracted data from Vision AI
    - Handle upload errors and retries
    - _Requirements: 2.1, 2.6, 2.3, 2.4, 2.5_

  - [ ] 18.4 Connect chat page to Chat Service
    - Implement WebSocket connection for real-time chat
    - Send messages to RAG engine
    - Display AI responses with sources
    - Handle language detection
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 18.5 Connect tribe page to Social Service
    - Fetch interest-based matches
    - Submit user interests
    - Handle connection requests
    - Display match scores and common interests
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 18.6 Connect admin page to Admin Service
    - Fetch verification queue with filters
    - Implement approve/reject actions
    - Display analytics and funnel data
    - Handle bulk operations
    - _Requirements: 8.1, 8.3, 10.1, 10.3_

  - [ ]* 18.7 Write integration tests for frontend-backend connection
    - Test API client error handling
    - Test authentication flow
    - Test real-time updates
    - _Requirements: 14.1, 15.1_

- [ ] 19. Enhance UI with real-time features
  - [ ] 19.1 Add real-time notifications to navbar
    - Implement notification bell with badge count
    - Show notification dropdown with recent alerts
    - Mark notifications as read
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 19.2 Add loading states and skeletons
    - Create skeleton loaders for all pages
    - Add loading spinners for async operations
    - Implement optimistic UI updates
    - _Requirements: 15.1_

  - [ ] 19.3 Enhance error handling in UI
    - Create error boundary components
    - Display user-friendly error messages
    - Add retry buttons for failed operations
    - _Requirements: 15.6_

  - [ ] 19.4 Add animations and transitions
    - Implement smooth page transitions
    - Add micro-interactions for buttons
    - Create floating animations for AI elements
    - Maintain minimal futuristic aesthetic
    - _Requirements: 13.5_
