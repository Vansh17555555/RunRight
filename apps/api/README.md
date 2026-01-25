# RunRight API Service

The core orchestration layer for RunRight. This service handles user authentication, problem management, and job dispatching to the worker queue.

## 🚀 Features

- **Auth**: JWT-based authentication (Login/Register).
- **Submissions**: Async submission processing via Redis.
- **Judging**: Integration with a specialized worker for code evaluation.
- **Real-time**: Socket.io integration for instant result streaming.
- **Problems**: LeetCode-style problem management and test cases.

## 🛠️ Tech Stack

- **Node.js** & **Express**
- **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **Redis** (Pub/Sub & Queue)
- **Socket.io**

## 🏃 Getting Started

### Prerequisites

- Node.js (v18+)
- Redis running on `localhost:6379`
- PostgreSQL running (refer to root `.env`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Auth

- `POST /auth/register` - Create new account.
- `POST /auth/login` - Get access token.

### Problems

- `GET /problems` - List all challenges.
- `GET /problems/:slug` - Get problem details & sample tests.

### Submissions

- `POST /submissions` - Submit code for judging (Auth required).
- `GET /submissions/:id` - Polling fallback for results.

## 🔒 Security

- **Rate Limiting**: Protects against brute-force and DDoS.
- **Helmet**: Secures HTTP headers.
- **Validation**: Strict schema validation via **Zod**.
