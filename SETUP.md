# P.A.L. Setup Guide

Complete setup guide for the P.A.L. (Personal Assistant for Life on Campus) platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** or **Bun** (recommended for faster installs)
- **Git**
- **Docker** (optional, for Redis and ChromaDB)

## Quick Start

### 1. Clone and Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run setup:backend
```

### 2. Start Infrastructure Services

**Option A: Using Docker (Recommended)**
```bash
cd backend
docker-compose up -d
```

This starts:
- Redis on port 6379
- ChromaDB on port 8000

**Option B: Manual Installation**

Install Redis:
```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://redis.io/download
```

Install ChromaDB:
```bash
pip install chromadb
chroma run --path ./chroma_data
```

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Required: Google AI
GOOGLE_API_KEY=your_gemini_api_key

# Optional: Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Set Up Database

**Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and keys to `.env`

**Run Migrations:**
```bash
cd backend
npm run db:migrate
```

### 5. Start Development Servers

**Option A: Start Both (Frontend + Backend)**
```bash
# From root directory
npm run dev:all
```

**Option B: Start Separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:backend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

## Getting API Keys

### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to `GOOGLE_API_KEY` in `.env`

### Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_KEY`

### Twilio (Optional - for WhatsApp)

1. Create account at [twilio.com](https://www.twilio.com)
2. Get a WhatsApp-enabled number
3. Copy credentials to `.env`

## Project Structure

```
pal-campus-assistant/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── db/           # Database
│   └── package.json
└── package.json          # Root package.json
```

## Development Workflow

### Frontend Development
```bash
npm run dev
```
- Hot reload enabled
- Access at http://localhost:3000
- Edit files in `src/app/` and `src/components/`

### Backend Development
```bash
npm run dev:backend
```
- Hot reload with tsx watch
- Access at http://localhost:3001
- Edit files in `backend/src/`

### Database Changes
```bash
cd backend
# Edit backend/src/db/schema.sql
npm run db:migrate
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test
npm test -- path/to/test.ts
```

## Building for Production

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Start production servers
npm start              # Frontend
npm run start:backend  # Backend
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

### ChromaDB Connection Failed
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Start ChromaDB
docker-compose up chromadb
# or
chroma run --path ./chroma_data
```

### Database Migration Errors
```bash
# Check Supabase connection
cd backend
node -e "require('./dist/config/database').testDatabaseConnection()"

# Verify environment variables
cat .env | grep SUPABASE
```

## Next Steps

1. ✅ Complete setup following this guide
2. 📖 Read `backend/README.md` for API documentation
3. 🎯 Check `.kiro/specs/pal-campus-assistant/tasks.md` for implementation tasks
4. 🚀 Start implementing features!

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the spec documents in `.kiro/specs/pal-campus-assistant/`
3. Check backend logs in `backend/logs/`

## License

MIT
