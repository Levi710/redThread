# RedThread

**AI-assisted location-based recommendation platform** that combines intelligent intent parsing, safety validation, and structured data extraction.

## Architecture

```
ultimate_spider/
├── client/               # React + Vite frontend
│   └── src/
│       ├── api/          # Backend communication layer
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page-level compositions
│       └── styles/       # Design system
└── server/               # Node.js + Express backend
    └── src/
        ├── config/       # Environment-driven configuration
        ├── controllers/  # Request orchestration (thin)
        ├── middleware/   # Rate limiting, safety guard, error handler
        ├── routes/       # HTTP route definitions
        ├── services/     # Business logic (AI, safety, scraper)
        ├── utils/        # Logger, custom errors
        └── validators/   # Request body validation
```

## Quick Start

```bash
# Backend
cd server
npm install
cp .env.example .env     # Add your GROQ_API_KEY
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health**: http://localhost:3001/api/health

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite |
| Backend | Express 4, Node.js |
| AI | Groq API (Llama 3.3 70B) |
| Security | Helmet, CORS, Rate Limiting, Safety Middleware |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | Environment (development/production) |
| `GROQ_API_KEY` | Groq API key for AI intent parsing |
