# P.A.L. Backend Services

AI-powered backend services for the Personal Assistant for Life on Campus (P.A.L.) platform.

## Features

- 🤖 **AI-Powered RAG Chat**: Conversational AI using Google Gemini and LangChain
- 📄 **Smart Document Verification**: Vision AI for automatic document processing
- 📊 **Progress Tracking**: Real-time onboarding progress monitoring
- 🔔 **Multi-Channel Notifications**: WhatsApp, SMS, Email, Push notifications
- 🤝 **Social Matching**: Interest-based peer connection system
- 📈 **Analytics Dashboard**: Admin insights and funnel analytics
- 😊 **Sentiment Analysis**: Student well-being monitoring

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Vector DB**: ChromaDB
- **Cache/Queue**: Redis + Bull
- **AI**: Google Gemini 1.5 Pro, LangChain
- **Storage**: Supabase Storage

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL (via Supabase)
- Redis
- ChromaDB
- Google Cloud API Key (Gemini)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required configuration variables.

### Key Variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `GOOGLE_API_KEY`: Google Gemini API key
- `REDIS_URL`: Redis connection string
- `CHROMA_HOST`: ChromaDB host (default: localhost)

## API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/verify-otp
POST /api/v1/auth/logout
```

### Users
```
GET /api/v1/users/profile
GET /api/v1/users/progress
PUT /api/v1/users/profile
```

### Documents
```
POST /api/v1/documents/upload
GET /api/v1/documents/:id
GET /api/v1/documents/status/:id
```

### Chat
```
POST /api/v1/chat/message
GET /api/v1/chat/history
```

### Social (Tribe Matcher)
```
POST /api/v1/social/interests
GET /api/v1/social/matches
POST /api/v1/social/respond/:matchId
```

### Admin
```
GET /api/v1/admin/queue
GET /api/v1/admin/analytics
POST /api/v1/admin/knowledge
POST /api/v1/admin/bulk-notify
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── db/              # Database migrations
│   └── index.ts         # Entry point
├── logs/                # Application logs
├── uploads/             # Temporary file uploads
└── dist/                # Compiled output
```

## Database Schema

The database includes tables for:
- Users and authentication
- Documents and verification
- Tasks and progress tracking
- Conversations and messages
- Interests and matches
- Alerts and notifications
- Knowledge base documents

See `src/db/schema.sql` for complete schema.

## License

MIT
