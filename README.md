# Stock Management Dashboard (Next.js + Laravel API)

This is a production-ready Stock Management Dashboard built with **Next.js 15, React 19, TypeScript, and Tailwind CSS**, using a **Laravel API** backend. It provides end-to-end workflows for managing materials, inventory transactions, consumption lists, requisitions, and user administration.

- Live Frontend: https://stock-management-rho-silk.vercel.app/
- Production API Base: https://stock.biznessimpact.com/api/v1
- Auth Base: https://stock.biznessimpact.com (e.g., POST /api/login)

## Overview

The app offers a clean, responsive admin experience with role-ready endpoints. It’s built on a solid API layer (`src/lib/api.ts`) that centralizes all HTTP calls, token handling, and error logging.

### Highlight Features
- Materials management with extra fields and images
- Inventory transactions: stock-in, stock-out, and adjustments
- Consumption lists (bill-of-materials style entries)
- Requisitions workflow: create, list, approve, reject
- Notifications feed
- User management (activate/deactivate)
- Theming via Tailwind and a modern dashboard UI

### Tech Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS v4
- Axios for HTTP
- Laravel (API v1) on the backend

## Architecture & Key Files
- `src/lib/api.ts`
  - Centralized Axios clients, auth interceptor (Authorization: Bearer token), and typed API wrappers.
  - Environment-driven base URLs:
    - `NEXT_PUBLIC_API_BASE_URL` → e.g., `https://stock.biznessimpact.com/api/v1`
    - `NEXT_PUBLIC_AUTH_BASE_URL` → e.g., `https://stock.biznessimpact.com`
  - Helper `getImageUrl` builds absolute URLs from the API origin for images.

## Environment & Configuration
Create `.env.local` for local development:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:8000
```

Set the following on Vercel (Project → Settings → Environment Variables):

```
NEXT_PUBLIC_API_BASE_URL=https://stock.biznessimpact.com/api/v1
NEXT_PUBLIC_AUTH_BASE_URL=https://stock.biznessimpact.com
```

## Running Locally
```
npm install
npm run dev
# App will start at http://localhost:3000
```

Ensure the Laravel API is running locally at `http://localhost:8000` and CORS allows `http://localhost:3000`.

## Deploy
- Frontend: Vercel (uses env vars above)
- Backend: Laravel on your server with document root pointing to `public/` and rewrites enabled
- CORS (Laravel `config/cors.php`):
  - `allowed_origins` should include `https://stock-management-rho-silk.vercel.app`
  - Typical headers: `Content-Type, Accept, Authorization, X-Requested-With`

## Example API Workflows
- Auth: `POST {AUTH_BASE}/api/login` stores token (frontend adds `Authorization: Bearer <token>` via interceptor)
- Materials: `GET {API_BASE}/materials`, `POST /materials`, `PUT /materials/{id}`
- Inventory: `POST /materials/{id}/stock-in`, `POST /materials/{id}/stock-out`, `POST /materials/{id}/adjust`
- Requisitions: `POST /requisitions`, `GET /requisitions`, `POST /requisitions/{id}/approve|reject`

## Security Notes
- No cookies required; token is sent in the `Authorization` header.
- For production, ensure HTTPS termination and correct `APP_URL` on the backend.

## Credits
This UI is based on the excellent TailAdmin template (details below). API and integration logic have been customized for the Stock Management domain.

---
