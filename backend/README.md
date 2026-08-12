# FluentAI Backend Architecture (Module 1 - Foundation)

Clean Architecture, scalable, production-ready Express + TypeScript backend foundation for **FluentAI Language Mentor**.

---

## 🚀 Overview

Module 1 provides the foundational architecture for the FluentAI backend API without business logic, databases, or AI integrations. It sets up strict TypeScript configurations, centralized environment management, request tracing, global error handling, logging, health endpoints, and graceful process lifecycle handlers.

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/               # Environment & Server configurations (env.ts, server.config.ts)
│   ├── constants/            # HTTP status codes & system constants
│   ├── controllers/          # Request handlers (Health controller)
│   ├── database/             # Database connection setup (Module 2 readiness)
│   ├── interfaces/           # Standard API response & domain TypeScript interfaces
│   ├── middleware/           # Request ID, CORS, Helmet, Logger, Error & 404 middlewares
│   ├── repositories/         # Data access abstractions (Module 2 readiness)
│   ├── routes/               # API route definitions (/api/v1/health)
│   ├── services/             # Business logic layer (Health service)
│   ├── types/                # Express & ambient TypeScript declarations
│   ├── utils/                # ApiError, ApiResponse, asyncHandler, logger
│   ├── validators/           # Request schema validation (Module 2 readiness)
│   ├── app.ts                # Express application setup
│   ├── server.ts             # Server listener & graceful shutdown handlers
│   └── index.ts              # Package entrypoint
│
├── .env                      # Environment configuration file
├── .env.example              # Environment configuration template
├── .eslintrc.cjs             # ESLint configuration
├── .gitignore                # Git ignore rules
├── .prettierrc               # Prettier formatting rules
├── package.json              # NPM dependencies & scripts
├── tsconfig.json             # TypeScript compiler settings
└── README.md                 # Documentation
```

---

## ⚙️ Environment Variables

The backend requires the following environment variables (defined in `.env`):

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Application execution environment (`development` / `production`) | `development` |
| `PORT` | HTTP server port | `5000` |
| `API_PREFIX` | Versioned API base route path | `/api/v1` |
| `CLIENT_URL` | Frontend client origin allowed by CORS policy | `http://localhost:5173` |

---

## 🛠️ Installation & Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify environment file:**
   ```bash
   cp .env.example .env
   ```

---

## 💻 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the server in development mode with auto-reload (`ts-node-dev`) |
| `npm run build` | Compiles TypeScript code to `dist/` |
| `npm start` | Runs the compiled production code from `dist/server.js` |
| `npm run lint` | Runs ESLint to check for code quality issues |
| `npm run lint:fix` | Automatically fixes auto-fixable ESLint issues |
| `npm run format` | Formats all TypeScript files using Prettier |
| `npm run typecheck` | Validates TypeScript types without emitting output files |

---

## 📡 API Endpoints

### **Health Check**

Checks server status, execution environment, and timestamp.

- **Route:** `GET /api/v1/health`
- **Response Example:**
  ```json
  {
    "success": true,
    "message": "FluentAI Backend is running",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2026-08-03T10:57:51.000Z",
    "requestId": "5e13d9e8-422d-4b8c-8fcd-a5796b27e852"
  }
  ```

---

## 🔒 Security & Middleware Integration

- **Helmet**: Secures HTTP response headers.
- **CORS**: Enforces origin restrictions based on `CLIENT_URL`.
- **Morgan**: Logs HTTP request durations and status codes.
- **Compression**: Compresses payload responses using gzip.
- **Cookie Parser**: Parses cookie headers.
- **Request ID Middleware**: Generates unique `X-Request-Id` UUIDs for end-to-end request tracing.
- **Global Error Handler**: Captures operational errors and formats responses standardly.
