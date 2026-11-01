# 🎓 Kirtan Education API — Enterprise Node.js / Express / MongoDB Architecture

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/Express-v5.3%2B-blue.svg)](https://expressjs.com/)
[![MongoDB Mongoose](https://img.shields.io/badge/Mongoose-v9.11%2B-brightgreen.svg)](https://mongoosejs.com/)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened%20(OWASP%20Top%2010)-critical.svg)](#security-architecture)
[![Default Port](https://img.shields.io/badge/Port-9003-orange.svg)](#port--environment)

A production-grade, layered RESTful API boilerplate architected according to senior backend engineering standards (10+ years Node.js industry best practices). Engineered for enterprise security, resilience, modularity, and maintainability.

---

## 🏛️ Architecture Overview

The codebase is organized following the **Modular Layered Architecture (3-Tier)**:
Routes ➔ Middlewares (Auth / RBAC / Validation / Security) ➔ Controllers ➔ Services ➔ Models (Mongoose DAL).

```
Kirtan-Education/
├── src/
│   ├── config/
│   │   ├── env.config.js          # Zod schema validation for process.env (fails fast on invalid config)
│   │   ├── db.config.js           # Mongoose pool management, retry backoff & connection lifecycle
│   │   ├── logger.config.js       # Winston structured logging with rotating file & console transports
│   │   └── cors.config.js         # Strict origin whitelisting & preflight security configuration
│   ├── constants/
│   │   ├── httpStatusCodes.js     # Standard HTTP status codes & standard status messages
│   │   ├── roles.js               # RBAC role definitions (Admin, Instructor, Student, User)
│   │   └── index.js               # Centralized exports
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT Bearer + HttpOnly Cookie verification & password-change checks
│   │   ├── rbac.middleware.js     # Role-based access control authorization
│   │   ├── error.middleware.js    # Global centralized error handler (Mongoose, JWT, Zod, SyntaxError)
│   │   ├── notFound.middleware.js # RFC-compliant 404 handler
│   │   ├── validate.middleware.js # Generic Zod request validator (body, query, params)
│   │   ├── rateLimiter.middleware.js # Tiered rate limiting (General API + Strict Auth brute-force protection)
│   │   ├── requestId.middleware.js# Distributed tracing / Correlation ID (X-Request-Id)
│   │   └── security.middleware.js # Helmet, Mongo-Sanitize, and HPP parameter pollution defense
│   ├── modules/
│   │   ├── auth/                  # Authentication Module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   ├── user/                  # User Management & RBAC Module
│   │   │   ├── user.controller.js
│   │   │   ├── user.model.js
│   │   │   ├── user.routes.js
│   │   │   ├── user.service.js
│   │   │   └── user.validation.js
│   │   └── health/                # System Diagnostics & Health Check
│   │       ├── health.controller.js
│   │       └── health.routes.js
│   ├── utils/
│   │   ├── apiError.js            # Operational vs Programming Error abstraction
│   │   ├── apiResponse.js         # Standardized JSON response envelope
│   │   ├── catchAsync.js          # High-performance async wrapper eliminating try/catch boilerplate
│   │   ├── password.util.js       # Bcrypt (12 rounds) & crypto hashing/token utilities
│   │   └── token.util.js          # Dual JWT token creation (Access + Refresh Token rotation)
│   ├── app.js                     # Express application configuration & middleware pipeline
│   └── server.js                  # HTTP server bootstrap, graceful shutdown & uncaught error hooks
├── logs/                          # Daily rotating logs (error.log, combined.log)
├── .editorconfig                  # Uniform indentation & whitespace across editors
├── .env.example                   # Complete template of all required environment variables
├── .env                           # Local environment configuration
├── .gitignore                     # Git ignore rules for node_modules, logs, and secrets
├── .prettierrc                    # Code formatting configuration
├── package.json                   # Dependencies, scripts, and ESM definition
└── README.md                      # Comprehensive system documentation
```

---

## 🛡️ Security Architecture & Hardening

1. **Helmet HTTP Headers**:
   - Strict `Content-Security-Policy` (CSP)
   - HTTP Strict Transport Security (`HSTS`) with `maxAge: 31536000`, `includeSubDomains`, and `preload`
   - Anti-clickjacking (`X-Frame-Options: DENY`)
   - Anti-MIME sniffing (`X-Content-Type-Options: nosniff`)
   - `X-Download-Options: noopen`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Strips `X-Powered-By` header to hide technology stack.

2. **NoSQL Injection Defense**:
   - `express-mongo-sanitize` strips all `$` and `.` MongoDB query operator characters from `req.body`, `req.query`, and `req.params`.

3. **HTTP Parameter Pollution (HPP)**:
   - Prevents array injection attacks against query parameters with strict parameter whitelisting.

4. **Multi-Tiered Rate Limiting**:
   - **General API Limiter**: 100 requests per 15-minute window per IP (`express-rate-limit`).
   - **Auth Limiter**: 10 requests per 15-minute window on sensitive endpoints (`/register`, `/login`, `/forgot-password`, `/reset-password`) to prevent credential stuffing and brute-force attacks.

5. **Account Lockout on Consecutive Failed Attempts**:
   - Automatically tracks failed password attempts. After 5 consecutive invalid logins, the account is locked for 15 minutes.

6. **JWT Dual-Token Pattern with Refresh Token Rotation**:
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (7 days) stored with automatic token rotation. If token reuse or session replay is detected, all associated sessions are invalidated immediately.
   - Dual transport: Supports standard `Authorization: Bearer <token>` header as well as secure, `HttpOnly`, `SameSite: Strict`, encrypted cookies.

7. **Password Security**:
   - Salted and hashed with `bcryptjs` using 12 salt rounds.
   - Passwords never returned by queries (`select: false` on Mongoose schema).
   - Timestamp verification (`passwordChangedAt`): If a user changes their password, all previously issued access tokens are rejected.
   - Password reset tokens stored in the database are hashed with SHA-256 (not plain text) to prevent exposure during database leakages.

8. **DoS & Payload Restrictions**:
   - Body parsers restricted to a maximum payload size of `10kb`.

---

## 💥 Resilient Error Handling & Logging

### Error Classification
The system explicitly separates **Operational Errors** (user mistakes, invalid input, resource not found) from **Programming Errors** (runtime bugs, unhandled rejections).

- **Mongoose CastError** (invalid ObjectId) ➔ automatically normalized to `400 Bad Request`.
- **Mongoose ValidationError** ➔ normalized to `422 Unprocessable Entity` with clean `{ field, message }` arrays.
- **MongoDB 11000 Duplicate Key** ➔ normalized to `409 Conflict` showing the exact duplicate field.
- **JWT Errors** (`JsonWebTokenError`, `TokenExpiredError`) ➔ normalized to `401 Unauthorized`.
- **Express JSON Body Parser SyntaxError** ➔ normalized to `400 Bad Request`.

### Response Envelope Contracts

#### 🟢 Standard Success Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-01T17:23:09.077Z",
    "requestId": "d5d114d0-471c-4e3d-9c63-f6be3a7e2d3f"
  }
}
```

#### 🔴 Standard Error Response:
```json
{
  "success": false,
  "statusCode": 400,
  "status": "fail",
  "message": "Request body validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format",
      "target": "body"
    }
  ],
  "meta": {
    "timestamp": "2026-11-01T17:23:09.086Z",
    "requestId": "e266ec45-f77c-4394-a8ce-11a6cd7aed05",
    "path": "/api/v1/auth/login",
    "method": "POST"
  }
}
```

> **Security Note**: In production (`NODE_ENV=production`), internal stack traces and database internals are completely suppressed. The client receives a safe error message while full diagnostic traces are securely written to `logs/error.log`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **MongoDB**: v6.0 or higher (Local or MongoDB Atlas)

### 2. Installation
```bash
# Clone or navigate into directory
cd Kirtan-Education

# Install dependencies (already executed)
npm install
```

### 3. Environment Setup
The project uses port **9003** by default. Inspect or edit `.env`:
```env
NODE_ENV=development
PORT=9003
MONGODB_URI=mongodb://127.0.0.1:27017/kirtan_education
JWT_ACCESS_SECRET=c518df9a85012e8477ffec954d2e5b7b6540c4a4e8d356c39a3f2b6e1e123456
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
JWT_REFRESH_EXPIRATION=7d
JWT_COOKIE_EXPIRES_IN_DAYS=7
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 4. Running the Server
```bash
# Development mode with hot-reloading (nodemon)
npm run dev

# Production mode
npm start
```

---

## 📡 API Reference & cURL Testing Guide

### 🩺 1. Health & Diagnostics

#### `GET /api/v1/health`
Checks memory usage, uptime, Node runtime version, and MongoDB connection status.
```bash
curl -X GET http://localhost:9003/api/v1/health
```

---

### 🔐 2. Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
Register a new account. Password requires at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (`@$!%*?&_\-#`).
```bash
curl -X POST http://localhost:9003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Johnson",
    "email": "alex.johnson@example.com",
    "password": "SecurePassword@2026",
    "role": "user"
  }'
```

#### `POST /api/v1/auth/login`
Authenticate with email and password.
```bash
curl -X POST http://localhost:9003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.johnson@example.com",
    "password": "SecurePassword@2026"
  }'
```

#### `POST /api/v1/auth/refresh-token`
Exchange refresh token for a fresh access token.
```bash
curl -X POST http://localhost:9003/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<YOUR_REFRESH_TOKEN>"
  }'
```

#### `GET /api/v1/auth/me`
Retrieve authenticated user profile.
```bash
curl -X GET http://localhost:9003/api/v1/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

#### `POST /api/v1/auth/change-password`
Change current user's password.
```bash
curl -X POST http://localhost:9003/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "currentPassword": "SecurePassword@2026",
    "newPassword": "UpdatedPassword@2026!"
  }'
```

#### `POST /api/v1/auth/forgot-password`
Request password reset token.
```bash
curl -X POST http://localhost:9003/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.johnson@example.com"
  }'
```

#### `POST /api/v1/auth/reset-password`
Reset password using the reset token.
```bash
curl -X POST http://localhost:9003/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "password": "BrandNewPassword@2026!"
  }'
```

#### `POST /api/v1/auth/logout`
Revoke refresh token and clear cookies.
```bash
curl -X POST http://localhost:9003/api/v1/auth/logout \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

### 👥 3. User & Admin Management (`/api/v1/users`)

#### `GET /api/v1/users/me`
Fetch current user profile.
```bash
curl -X GET http://localhost:9003/api/v1/users/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

#### `PATCH /api/v1/users/me`
Update current user profile.
```bash
curl -X PATCH http://localhost:9003/api/v1/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "name": "Alex J. Smith"
  }'
```

#### `GET /api/v1/users` *(Admin / Super Admin only)*
Paginated search and list of users.
```bash
curl -X GET "http://localhost:9003/api/v1/users?page=1&limit=10&role=user&search=alex" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

#### `PATCH /api/v1/users/:id/role` *(Admin / Super Admin only)*
Change a user's role (`super_admin`, `admin`, `instructor`, `student`, `user`).
```bash
curl -X PATCH http://localhost:9003/api/v1/users/<USER_ID>/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -d '{
    "role": "instructor"
  }'
```

#### `DELETE /api/v1/users/:id` *(Admin / Super Admin only)*
Delete user account.
```bash
curl -X DELETE http://localhost:9003/api/v1/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

---

## 🔄 Graceful Shutdown Lifecycle

When stopping the process or deploying in Kubernetes / Docker / PM2:
1. Catches `SIGTERM` / `SIGINT` / `unhandledRejection`.
2. Stops accepting new inbound HTTP requests (`server.close()`).
3. Allows all active, in-flight HTTP requests to finish cleanly.
4. Safely closes the MongoDB connection pool (`mongoose.connection.close()`).
5. Exits process with code `0` (or `1` if an error occurs).
6. 10-second fail-safe timer guarantees the process will never hang or zombie in containerized orchestrators.

---

## 📜 License
ISC License. Built for high scalability and enterprise security.
