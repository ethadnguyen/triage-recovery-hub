# Backend Express.js - AI Support Triage Hub

Backend sử dụng Express.js + TypeScript với Layered Architecture.

## Cấu trúc thư mục

```
backend-express/
├── prisma/
│   └── schema.prisma         # Prisma Schema
├── src/
│   ├── config/               # Configuration
│   │   ├── index.ts          # Config chính
│   │   ├── database.ts       # Prisma client
│   │   ├── redis.ts          # Redis connection
│   │   └── logger.ts         # Winston logger
│   ├── models/               # Zod Schemas
│   │   └── schemas/
│   │       ├── ticket.schema.ts
│   │       └── ai.schema.ts
│   ├── repositories/         # Data Access Layer
│   │   └── ticket.repository.ts
│   ├── services/             # Business Logic
│   │   ├── ai.service.ts     # OpenAI integration
│   │   ├── queue.service.ts  # BullMQ queue
│   │   └── ticket.service.ts # Ticket business logic
│   ├── controllers/          # Request/Response handling
│   │   ├── ticket.controller.ts
│   │   └── health.controller.ts
│   ├── workers/              # Background tasks
│   │   ├── index.ts          # Worker entry
│   │   └── triage.worker.ts  # Triage job processor
│   ├── routes/               # Express routes
│   ├── middleware/           # Error handling
│   ├── container.ts          # Dependency Injection
│   ├── app.ts                # Express app setup
│   └── index.ts              # Server entry point
├── Dockerfile
├── Dockerfile.dev
└── package.json
```

## Luồng xử lý (Data Flow)

```
Client Request
     │
     ▼
┌─────────────┐
│ Controller  │  ← Nhận request, validate với Zod
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Service    │  ← Business logic, gọi Repository & QueueService
└─────┬───────┘
      │
      ├────────────────┐
      ▼                ▼
┌──────────┐    ┌─────────────┐
│Repository│    │QueueService │
└────┬─────┘    └──────┬──────┘
     │                 │
     ▼                 ▼
┌──────────┐    ┌───────────┐    ┌──────────┐
│PostgreSQL│    │   Redis   │───►│  Worker  │
└──────────┘    └───────────┘    └────┬─────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ AI Service  │
                               └─────────────┘
```

## Chạy ứng dụng

### Sử dụng Docker Compose

```bash
# Từ thư mục gốc
docker-compose -f docker-compose.express.yml up -d

# Xem logs
docker-compose -f docker-compose.express.yml logs -f backend worker

# Dừng
docker-compose -f docker-compose.express.yml down
```

### Chạy riêng lẻ (Development)

```bash
cd backend-express

# Cài đặt dependencies
npm install

# Copy .env
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Chạy migration
npx prisma migrate dev

# Chạy server
npm run dev

# Chạy worker (terminal khác)
npm run worker:dev
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Root info |
| GET | `/health` | Health check |
| POST | `/tickets` | Tạo ticket (non-blocking) |
| GET | `/tickets` | Danh sách tickets |
| GET | `/tickets/stats` | Thống kê |
| GET | `/tickets/:id` | Chi tiết ticket |
| GET | `/tickets/:id/status` | Trạng thái triage |
| PATCH | `/tickets/:id` | Cập nhật ticket |
| POST | `/tickets/:id/approve` | Approve ticket |
| POST | `/tickets/:id/reject` | Reject ticket |
| POST | `/tickets/:id/retry` | Retry triage |

## Prisma Commands

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name <name>

# Deploy migration (production)
npx prisma migrate deploy

# Push schema changes (no migration)
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## Dependency Injection

Sử dụng Singleton Container pattern:

```typescript
// container.ts
class Container {
  get ticketRepository(): TicketRepository {
    return new TicketRepository(prisma);
  }

  get ticketService(): TicketService {
    return new TicketService(
      this.ticketRepository,  // Injected
      this.queueService       // Injected
    );
  }
}
```

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Queue**: BullMQ + Redis
- **Validation**: Zod
- **AI**: OpenAI GPT-4o-mini
- **Logging**: Winston
