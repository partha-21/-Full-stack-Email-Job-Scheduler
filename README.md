# ReachInbox - Full-Stack Email Job Scheduler

Production-grade full-stack email outreach scheduler built with React, TypeScript, Express, PostgreSQL (Prisma), BullMQ, Redis, Nodemailer (Ethereal SMTP), Elasticsearch, Google OAuth, and Slack Integration.

---

## 🏗️ Architecture

```
                          ┌────────────────────────┐
                          │   React 18 + Vite UI   │
                          │ (Tailwind, TS, Axios)  │
                          └───────────┬────────────┘
                                      │ REST API / Auth Session
                                      ▼
                          ┌────────────────────────┐
                          │ Express TypeScript API │
                          └─┬──────┬──────┬──────┬─┘
                            │      │      │      │
          ┌─────────────────┘      │      │      └─────────────────┐
          ▼                        ▼      ▼                        ▼
┌──────────────────┐    ┌────────────┐  ┌──────────────┐  ┌──────────────────┐
│ PostgreSQL DB    │    │ Redis      │  │ Ethereal     │  │ Elasticsearch    │
│ (Prisma ORM)     │    │ (BullMQ &  │  │ SMTP Server  │  │ (Email Index &   │
│ - Users          │    │ Rate Limit │  │ (Nodemailer) │  │ Search Service)  │
│ - Campaigns      │    └─────┬──────┘  └──────────────┘  └──────────────────┘
│ - Scheduled Jobs │          │
│ - Slack Tokens   │          ▼
└──────────────────┘    ┌────────────────────────┐
                        │ Worker Process         │
                        │ - Idempotency Check    │
                        │ - Sliding Rate Limit   │
                        │ - Auto-Rescheduling    │
                        │ - Slack Notification   │
                        └────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Backend**: Node.js, Express.js, TypeScript, Passport.js
- **Database & ORM**: PostgreSQL 15, Prisma ORM
- **Queue & Rate Limiting**: BullMQ 5, Redis 7 (ioredis)
- **Email Delivery**: Nodemailer, Ethereal SMTP Sandbox
- **Search Engine**: Elasticsearch 8.8 (`@elastic/elasticsearch`)
- **Integrations**: Google OAuth 2.0, Slack Web API (`@slack/web-api`)
- **Live Dashboard**: BullBoard (`@bull-board/express`)
- **Containerization**: Docker, Docker Compose

---

## 📁 Monorepo Folder Structure

```
reachinbox-email-scheduler/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   ├── load-test.ts
│   │   ├── rate-limit-test.ts
│   │   └── restart-test.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── elasticsearch.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   └── slack.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── queues/
│   │   │   └── email.queue.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── email.routes.ts
│   │   │   └── slack.routes.ts
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── ethereal.service.ts
│   │   │   ├── elasticsearch.service.ts
│   │   │   ├── slack.service.ts
│   │   │   └── rateLimiter.service.ts
│   │   ├── workers/
│   │   │   └── email.worker.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── EmailRow.tsx
    │   │   └── SendLaterModal.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── ScheduledPage.tsx
    │   │   ├── SentPage.tsx
    │   │   ├── EmailDetailPage.tsx
    │   │   └── ComposePage.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- Docker & Docker Compose

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Launch Infrastructure via Docker
Start PostgreSQL, Redis, and Elasticsearch:
```bash
docker compose up -d
```

### 3. Backend Setup & Migrations
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

The backend server will start on `http://localhost:5000`.
BullMQ Live Dashboard is accessible at `http://localhost:5000/admin/queues`.

### 4. Frontend Startup
```bash
cd ../frontend
npm install
npm run dev
```
The React frontend application will launch on `http://localhost:5173`.

---

## 🔑 OAuth Setup Details

### Google OAuth 2.0
1. Create a project in the Google Cloud Console.
2. Configure OAuth consent screen and add Redirect URI: `http://localhost:5000/api/auth/google/callback`.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. *Dev Quick Login*: On the login screen, a developer sign-in button is provided for instant testing without OAuth keys.

### Slack OAuth Integration
1. Create a Slack App in api.slack.com.
2. Add Bot Scopes: `chat:write`, `channels:read`.
3. Set Redirect URI: `http://localhost:5000/api/slack/callback`.
4. Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in `.env`.
5. Connect your workspace via the Slack widget in the app sidebar.

---

## ⚙️ Core Technical Capabilities

### 1. Redis Sliding Window Rate Limiting
- Evaluated per sender (`rate_limit:sender:{email}`).
- Uses atomic Redis Sorted Sets (ZSET) to track execution timestamps within a 1-hour window.
- If `MAX_EMAILS_PER_HOUR_PER_SENDER` is exceeded:
  - Calculates the exact millisecond offset when the next window opens.
  - Automatically delays/reschedules the job in BullMQ without dropping emails.
  - Sends a real Slack alert notification if the user has connected Slack.

### 2. Idempotency Engine
- Unique `idempotencyKey` formatted per email (`idemp:${userId}:${campaignId}:${recipient}:${index}`).
- Worker verifies DB status before dispatching. If status is already `SENT`, job completes instantly without duplicate dispatches.

### 3. Server Restart Persistence
- BullMQ delayed jobs are persisted in Redis.
- If the backend crashes or restarts, pending and delayed jobs resume at their scheduled time.

---

## 🧪 Automated Testing Scripts

Run tests from the `backend/` directory:

### 1,000+ Email Load Test
```bash
npm run test:load
```
Enqueues 1,000 simulated jobs into BullMQ to verify queue throughput and worker concurrency (`WORKER_CONCURRENCY=5`).

### Sender Rate Limit Test
```bash
npm run test:ratelimit
```
Sets sender limit to 3 emails/hr, queues 10 emails, verifies first 3 dispatches immediately, and confirms remaining 7 are rescheduled with Slack notification.

### Restart Persistence Test
```bash
npm run test:restart
```
Queues a delayed job (+120s). Instructions test stopping and restarting the server process while verifying job survival.

---

## 📋 Requirement Mapping Matrix

| Assignment Requirement | Implementation | Status |
| :--- | :--- | :---: |
| **Real Google OAuth** | `passport-google-oauth20` + JWT auth cookies | ✅ Completed |
| **Scheduled Emails UI** | Screen 2 with recipient, time, subject, status, preview | ✅ Completed |
| **Sent Emails UI** | Screen 3 with sent timestamp, status, and Ethereal preview links | ✅ Completed |
| **Email Detail View** | Screen 4 with subject, sender avatar, recipient, body, actions | ✅ Completed |
| **Compose View** | Screen 5 with From, To, Subject, Body, Delay, Limit | ✅ Completed |
| **CSV / Text Upload** | Regex parser extracting valid emails & showing detected count badge | ✅ Completed |
| **Send Later Panel** | Screen 6 date/time picker + quick options ("30 min", "Tomorrow 9 AM") | ✅ Completed |
| **PostgreSQL + Prisma** | Relational schema (User, Campaign, Email, SlackConnection) | ✅ Completed |
| **BullMQ + Redis** | Persistent delayed queue (`emailQueue`) - No cron | ✅ Completed |
| **Worker Concurrency** | Configurable worker concurrency via `WORKER_CONCURRENCY` env | ✅ Completed |
| **Min Email Delay** | Configurable delay enforcement (`MIN_EMAIL_DELAY_MS`) | ✅ Completed |
| **Hourly Rate Limit** | Atomic Redis sliding window per sender (`MAX_EMAILS_PER_HOUR_PER_SENDER`) | ✅ Completed |
| **Rate Limit Reschedule**| Calculates next hour window & reschedules job without dropping | ✅ Completed |
| **Real Slack Alert** | Triggers Slack API `chat.postMessage` on hourly limit reach | ✅ Completed |
| **Ethereal SMTP** | Nodemailer with Ethereal sandbox & web preview URLs | ✅ Completed |
| **Idempotency** | Pre-flight DB check preventing duplicate sends on retry | ✅ Completed |
| **Restart Persistence** | BullMQ Redis state retention across backend restarts | ✅ Completed |
| **Elasticsearch** | `@elastic/elasticsearch` indexing & fuzzy search API | ✅ Completed |
| **BullMQ Live Board** | Mounted at `/admin/queues` via `@bull-board/express` | ✅ Completed |
| **Docker Compose** | PostgreSQL, Redis, and Elasticsearch containers | ✅ Completed |
