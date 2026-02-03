# Frontend - AI Support Triage Hub

Next.js 14 + Tailwind CSS frontend for AI Support Triage & Recovery Hub.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Dashboard page
│   │   └── globals.css     # Global styles + Tailwind
│   ├── components/
│   │   ├── TicketCard.tsx      # Ticket list item
│   │   ├── TicketDetail.tsx    # Ticket detail modal
│   │   ├── CreateTicketModal.tsx
│   │   └── StatsPanel.tsx      # Statistics dashboard
│   └── lib/
│       └── api.ts          # API client + types
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── Dockerfile
└── Dockerfile.dev
```

## Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker

```bash
# Development
docker build -f Dockerfile.dev -t triage-frontend-dev .
docker run -p 3000:3000 -v $(pwd):/app triage-frontend-dev

# Production
docker build -t triage-frontend .
docker run -p 3000:3000 triage-frontend
```

## Features

- **Dashboard**: Overview with statistics
- **Ticket List**: Color-coded by urgency (HIGH=red, MEDIUM=yellow, LOW=green)
- **Ticket Detail**: View AI analysis, edit draft reply, approve/reject
- **Create Ticket**: Submit new customer complaints
- **Real-time Updates**: Auto-refresh every 5 seconds
- **Filters**: Filter by status, urgency, category

## API Integration

Frontend connects to Express.js backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tickets` | GET | List tickets |
| `/tickets` | POST | Create ticket |
| `/tickets/:id` | GET | Get ticket |
| `/tickets/:id/approve` | POST | Approve ticket |
| `/tickets/:id/reject` | POST | Reject ticket |
| `/tickets/:id/retry` | POST | Retry AI triage |
| `/tickets/stats` | GET | Get statistics |
