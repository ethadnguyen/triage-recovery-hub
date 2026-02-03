# AI Support Triage & Recovery Hub

An AI-powered system for automatically categorizing and handling customer complaints.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SYSTEM OVERVIEW                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────────────────────────────────┐
│   Frontend  │     │              Backend (Express.js)            │
│  (Next.js)  │────►│  Controller → Service → Repository          │
│  Port 3000  │     │                  │                          │
└─────────────┘     │                  ▼                          │
                    │            QueueService ──► Redis (BullMQ)  │
                    │                                │             │
                    │                                ▼             │
                    │                           Worker             │
                    │                              │               │
                    │                              ▼               │
                    │                         AI Service           │
                    │                          (OpenAI)            │
                    │                              │               │
                    │                              ▼               │
                    │            Repository ◄──────┘              │
                    │                  │                          │
                    │                  ▼                          │
                    │             PostgreSQL                      │
                    └─────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Backend | Express.js, TypeScript, Prisma ORM |
| Queue | BullMQ + Redis |
| Database | PostgreSQL |
| AI | OpenAI GPT-4o-mini |
| Container | Docker, Docker Compose |

## Project Structure

```
triage-recovery-hub/
├── backend-express/          # Express.js Backend (TypeScript)
│   ├── prisma/               # Prisma Schema
│   ├── src/
│   │   ├── config/           # Configuration
│   │   ├── models/           # Zod Schemas
│   │   ├── repositories/     # Data Access Layer
│   │   ├── services/         # Business Logic
│   │   ├── controllers/      # Request/Response
│   │   ├── workers/          # Background Jobs
│   │   └── routes/           # Express Routes
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React Components
│   │   └── lib/              # API Client
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.express.yml  # Docker Compose for Express backend
└── README.md
```

## Quick Start

### 1. Clone and Configure

```bash
# Copy environment files
cp backend-express/.env.example backend-express/.env
cp frontend/.env.example frontend/.env.local

# (Optional) Add OpenAI API key
echo "OPENAI_API_KEY=sk-your-key" >> backend-express/.env
```

### 2. Start with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.express.yml up -d

# View logs
docker-compose -f docker-compose.express.yml logs -f

# Stop services
docker-compose -f docker-compose.express.yml down
```

### 3. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Customer Portal | http://localhost:3000 | Submit support tickets |
| Agent Dashboard | http://localhost:3000/agent | Review & handle tickets |
| Backend API | http://localhost:8000 | REST API |
| Health Check | http://localhost:8000/health | System status |

## Development (without Docker)

### Backend

```bash
cd backend-express

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start server
npm run dev

# Start worker (in another terminal)
npm run worker:dev
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/tickets` | Create ticket (returns 201 immediately) |
| GET | `/tickets` | List tickets (with filters) |
| GET | `/tickets/stats` | Get statistics |
| GET | `/tickets/:id` | Get ticket detail |
| GET | `/tickets/:id/status` | Get triage status |
| PATCH | `/tickets/:id` | Update ticket |
| POST | `/tickets/:id/approve` | Approve ticket |
| POST | `/tickets/:id/reject` | Reject ticket |
| POST | `/tickets/:id/retry` | Retry AI triage |

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER PORTAL (localhost:3000)                               │
│  └── Customer fills out support form                            │
│  └── Submits complaint                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND API                                                    │
│  └── POST /tickets                                              │
│  └── Save to DB (status: PENDING)                               │
│  └── Add job to Redis Queue                                     │
│  └── Return 201 Created immediately                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKGROUND WORKER                                              │
│  └── Pick up job from Redis Queue                               │
│  └── Update status: PROCESSING                                  │
│  └── Call OpenAI API for analysis                               │
│  └── Validate response with Zod schema                          │
│  └── Save results to DB                                         │
│  └── Update status: TRIAGED                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT DASHBOARD (localhost:3000/agent)                         │
│  └── Polls every 5 seconds for new tickets                      │
│  └── See color-coded tickets (by urgency)                       │
│  └── Review AI analysis & draft reply                           │
│  └── Edit if needed                                             │
│  └── Approve or Reject                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Non-blocking API**: Ticket creation returns immediately
- **AI Triage**: Automatic categorization, sentiment analysis, urgency detection
- **Structured Output**: OpenAI JSON mode with Zod validation
- **Retry Logic**: 3 attempts with exponential backoff
- **Color-coded UI**: Visual urgency indicators (HIGH=red, MEDIUM=yellow, LOW=green)
- **Real-time Updates**: Dashboard auto-refreshes every 5 seconds

## Environment Variables

### Backend (`backend-express/.env`)

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/triage_db
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (get key at https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Supported OpenAI Models

| Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Best For |
|-------|---------------------------|----------------------------|----------|
| gpt-4o-mini | $0.15 | $0.60 | Fast, cheap (default) |
| gpt-4o | $2.50 | $10.00 | Most capable |
| gpt-3.5-turbo | $0.50 | $1.50 | Legacy, fast |

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
