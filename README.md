# Social App Backend

A robust and modular Express + TypeScript + Mongoose backend for a social application.

## Features

- **Modular Architecture**: Feature-based folder structure (Auth, User, Post, etc.).
- **Centralized Configuration**: Environment variables are validated on startup using Zod.
- **Robust Error Handling**: Global error handler with specific support for Mongoose and Zod errors.
- **Async Utility**: `asyncHandler` wrapper to eliminate repetitive try/catch blocks.
- **Cloud Integration**: AWS S3 for file uploads and pre-signed URLs.
- **Redis Integration**: OTP management, token revocation, and caching.
- **Secure Authentication**: JWT-based auth with session revocation support.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- Redis

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `config/.env` (see `.env.example` if available).

### Development

Run the development server with auto-reload:
```bash
npm run start:dev
```

### Production

Build the project:
```bash
npm run build
```
Start the production server:
```bash
npm run start
```

## Folder Structure

- `src/app.bootstrap.ts`: Application initialization logic.
- `src/common`: Shared utilities, services, enums, and types.
- `src/modules`: Feature modules (Controllers, Services, Routers).
- `src/middleware`: Custom Express middlewares.
- `src/DB`: Database connection and Mongoose models/repositories.
- `config`: Configuration files and environment variables.
