# 🎓 Kirtan Education API — Enterprise TypeScript / Node.js / MongoDB Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/Express-v5.3%2B-lightgrey.svg)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Cluster-brightgreen.svg)](https://www.mongodb.com/cloud/atlas)
[![Port](https://img.shields.io/badge/Port-9003-orange.svg)](#port--environment)
[![Postman Collection](https://img.shields.io/badge/Postman-Collection%20Ready-FF6C37.svg)](#postman-collection)

An enterprise-grade, strictly typed **TypeScript**, Express, and MongoDB RESTful API built according to senior/staff backend engineering standards (10+ years experience). Features complete OTP verification, social authentication (Google, Facebook, Apple), device tracking, RBAC, Postman Collection, and enterprise security hardening.

---

## 🔑 Default Seed Account for Immediate Testing

The server automatically seeds and activates the following administrator account on bootstrap:

| Credential | Value |
| :--- | :--- |
| **Email** | `inderjeet@yopmail.com` |
| **Password** | `123456` |
| **Phone** | `6283396959` (`+91` / `IN`) |
| **Role** | `admin` |
| **Account Verified** | `true` |

---

## 🏛️ Architecture & Highlights

- **Language**: 100% Strict **TypeScript** (`ES2022`, `NodeNext` ESM modules, strict type checks).
- **Port**: Defaulted to **`9003`**.
- **Database**: **MongoDB Atlas** cluster (`kirtan-education` database with resilient connection pool).
- **Layered 3-Tier Pattern**: `Routes` ➔ `Middlewares` ➔ `Controllers` ➔ `Services` ➔ `Models`.
- **User Model Fields**:
  - `fullName`, `email`, `password` (hashed with `bcryptjs`, 12 rounds)
  - `phone`, `countryCode` (default `+91`), `isoCode` (default `IN`)
  - `role`: `'user' | 'admin'`
  - `isAccountVerified`: boolean
  - `otp`: numeric string (hidden by default)
  - `otpReason`: `'account_verify' | 'password_reset'`
  - `otpExpiry`: Date
  - `deviceType`: `'ios' | 'android' | 'web'`
  - `deviceToken`: string (e.g. FCM token)
  - `socialType`: `'google' | 'facebook' | 'apple'`
  - `socialId`: string
  - `refreshToken`, `passwordChangedAt`, `timestamps`
- **Authentication Flows**:
  1. **Sign Up**: Creates account, generates 6-digit numeric OTP with 10-minute expiry, sends tokens.
  2. **Verify OTP**: Verifies OTP and reason (`account_verify`), marks account verified.
  3. **Resend OTP**: Issues fresh 6-digit OTP for account activation or password reset.
  4. **Login**: Authenticates with email & password, validates account status, updates `deviceType` and `deviceToken`.
  5. **Forget Password**: Issues 6-digit OTP with `otpReason: 'password_reset'`.
  6. **Reset Password**: Verifies OTP and sets new password.
  7. **Social Login**: Instant authentication & registration with Google, Facebook, or Apple.
  8. **Profile**: `getProfile` (`GET /api/v1/users/profile`) and `updateProfile` (`PATCH /api/v1/users/profile`).
  9. **Security**: Centralized error handling, Helmet CSP, NoSQL Injection sanitizer, HPP, tiered Rate Limiter, and Correlation IDs (`X-Request-Id`).

---

## 📮 Postman Collection

A complete, import-ready Postman collection is provided in the root directory:
📂 [`postman_collection.json`](./postman_collection.json)

### Features included in the Postman collection:
- Pre-configured environment variables: `{{baseUrl}}`, `{{token}}`, `{{refreshToken}}`, `{{otp}}`.
- Automated test scripts that **automatically save access tokens, refresh tokens, and OTPs** directly into collection variables after Sign Up, Login, or OTP request calls.
- Every API endpoint organized into folders:
  - `1. Diagnostics & Health`
  - `2. Authentication Section`
  - `3. User Profile Section`

---

## 📂 Source Code Structure

```
Kirtan-Education/
├── src/
│   ├── app.ts                         # Express pipeline, security headers, rate limiting
│   ├── server.ts                      # Server bootstrap on port 9003, Atlas connect, graceful exit
│   ├── config/
│   │   ├── env.config.ts              # Zod environment variable parsing
│   │   ├── db.config.ts               # MongoDB Atlas connection manager & pool
│   │   ├── logger.config.ts           # Winston rotating file & colored console logger
│   │   └── cors.config.ts             # Strict CORS origin & method whitelist
│   ├── constants/
│   │   ├── roles.ts                   # User roles (user, admin), OTP reasons, device types, social types
│   │   └── httpStatusCodes.ts        # Standard HTTP status codes
│   ├── middlewares/
│   │   ├── auth.middleware.ts         # JWT authentication & session verification
│   │   ├── rbac.middleware.ts         # Role-Based Access Control
│   │   ├── error.middleware.ts        # Centralized global error handler
│   │   ├── notFound.middleware.ts     # 404 handler
│   │   ├── rateLimiter.middleware.ts  # Tiered API rate limiting
│   │   ├── requestId.middleware.ts    # Correlation ID generator (X-Request-Id)
│   │   ├── security.middleware.ts     # Helmet, Mongo Sanitize, HPP
│   │   └── validate.middleware.ts     # Zod schema request validator
│   ├── modules/
│   │   ├── auth/                      # Sign up, Login, OTP, Social, Password Reset
│   │   ├── user/                      # Profile management, Admin CRUD
│   │   └── health/                    # Diagnostics & Atlas connection check
│   ├── scripts/
│   │   └── seed.ts                    # Seeds default admin user (inderjeet@yopmail.com)
│   ├── types/
│   │   └── index.ts                   # IUser, IAuthTokens, IJwtPayload, Express declarations
│   └── utils/
│       ├── apiError.ts                # Operational error wrapper
│       ├── apiResponse.ts             # Standardized response envelope
│       ├── catchAsync.ts              # Async controller wrapper
│       ├── otp.util.ts                # Cryptographic 6-digit OTP generator & expiry
│       ├── password.util.ts           # Bcrypt & SHA-256 hashing
│       └── token.util.ts              # JWT signing, verification, and cookie helpers
├── dist/                              # Compiled production JavaScript files
├── postman_collection.json            # Importable Postman Collection
├── tsconfig.json                      # Strict TypeScript compiler configuration
├── package.json                       # Scripts: dev (tsx watch), build (tsc), start (dist)
├── .env                               # Local environment configuration
└── README.md
```

---

## 🚀 Running the Project

### Development Mode (with Live Hot-Reloading via `tsx watch`):
```bash
npm run dev
```

### Production Build & Start:
```bash
npm run build
npm start
```

---

## 📡 API Reference & Testing Guide

### 1. Sign Up (Register)
`POST /api/v1/auth/sign-up`
```bash
curl -X POST http://localhost:9003/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Inderjeet Singh",
    "email": "inderjeet@yopmail.com",
    "password": "123456",
    "phone": "6283396959",
    "countryCode": "+91",
    "isoCode": "IN",
    "deviceType": "ios",
    "deviceToken": "fcm-token-123"
  }'
```

### 2. Verify OTP (Account Verification)
`POST /api/v1/auth/verify-otp`
```bash
curl -X POST http://localhost:9003/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inderjeet@yopmail.com",
    "otp": "<RECEIVED_OTP>",
    "otpReason": "account_verify"
  }'
```

### 3. Resend OTP
`POST /api/v1/auth/resend-otp`
```bash
curl -X POST http://localhost:9003/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inderjeet@yopmail.com",
    "otpReason": "account_verify"
  }'
```

### 4. Login
`POST /api/v1/auth/login`
```bash
curl -X POST http://localhost:9003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inderjeet@yopmail.com",
    "password": "123456",
    "deviceType": "ios",
    "deviceToken": "fcm-token-123"
  }'
```

### 5. Forget Password (Request Reset OTP)
`POST /api/v1/auth/forget-password`
```bash
curl -X POST http://localhost:9003/api/v1/auth/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inderjeet@yopmail.com"
  }'
```

### 6. Reset Password (using OTP)
`POST /api/v1/auth/reset-password`
```bash
curl -X POST http://localhost:9003/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inderjeet@yopmail.com",
    "otp": "<RESET_OTP>",
    "newPassword": "123456"
  }'
```

### 7. Social Login (Google, Facebook, Apple)
`POST /api/v1/auth/social-login`
```bash
curl -X POST http://localhost:9003/api/v1/auth/social-login \
  -H "Content-Type: application/json" \
  -d '{
    "socialType": "google",
    "socialId": "google-user-id-987654",
    "email": "inderjeet.google@gmail.com",
    "fullName": "Inderjeet Singh",
    "deviceType": "android",
    "deviceToken": "android-token-xyz"
  }'
```

### 8. Get Profile
`GET /api/v1/users/profile`
```bash
curl -X GET http://localhost:9003/api/v1/users/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 9. Update Profile
`PATCH /api/v1/users/profile`
```bash
curl -X PATCH http://localhost:9003/api/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "fullName": "Inderjeet Singh (Updated)",
    "phone": "6283396959",
    "deviceType": "ios",
    "deviceToken": "updated-token"
  }'
```

### 10. Change Password
`POST /api/v1/auth/change-password`
```bash
curl -X POST http://localhost:9003/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "currentPassword": "123456",
    "newPassword": "newSecretPassword123"
  }'
```

---

## 📜 License
ISC License. Built for enterprise high-concurrency production deployments.
