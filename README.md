# MedFlow AI

MedFlow AI is a React/Vite medicine inventory interface with an Express/Mongoose API, administrator authentication, and MongoDB storage.

## Requirements

- Node.js 20.19+ (Node 24 is supported).
- MongoDB Community Server running locally, or another reachable MongoDB deployment.
- MongoDB Compass is optional and provides a visual database browser.

## First-time setup (Windows PowerShell)

1. Install dependencies from the project root:

   ```powershell
   npm install
   npm --prefix backend install
   ```

2. Create the backend environment file and edit it:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   notepad backend\.env
   ```

   Keep `MONGODB_URI=mongodb://127.0.0.1:27017/medflow_ai` for a local server. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` with at least 12 characters. To replace the template JWT placeholder with a cryptographically random secret without displaying it in the terminal, run:

   ```powershell
   node --input-type=module -e "import fs from 'node:fs'; import crypto from 'node:crypto'; const path='backend/.env'; const contents=fs.readFileSync(path,'utf8'); const match=contents.match(/^JWT_SECRET=(.*)$/m); if(!match) throw new Error('JWT_SECRET entry missing'); if(match[1] && !/replace-with|your-secret|change-me/i.test(match[1])) throw new Error('JWT_SECRET already configured; leaving it unchanged'); fs.writeFileSync(path,contents.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+crypto.randomBytes(48).toString('base64url')),{mode:0o600});"
   ```

   The server requires at least 32 bytes and loads this value from `backend/.env`. Do not commit either `.env` file. `.gitignore` excludes `.env` files at every directory level.

3. Set your admin password and synchronize the administrator record. The PowerShell helper asks for the password with hidden input, then seeds and verifies login/logout against `medflow_ai`:

   ```powershell
   .\backend\scripts\set-admin-password.ps1
   ```

   The helper stores your chosen password in `backend/.env`, uses the seed script to hash it with bcrypt, and never prints it. The seed script updates a matching admin or the sole existing admin; it stops without changes if multiple records make the target ambiguous. There is no public registration route.

## Start the application

Start MongoDB Community Server first. Open two terminals in the project root.

**Terminal 1 - backend:**

```powershell
npm --prefix backend run dev
```

**Terminal 2 - frontend:**

```powershell
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`) and sign in with the admin credentials configured in `backend/.env`. Vite proxies `/api` to `http://127.0.0.1:5000` in development. The frontend API base defaults to `/api`; set `VITE_API_BASE_URL` in a root `.env` only when using a different API URL. The frontend uses live database records by default.

Build and preview the frontend with:

```powershell
npm run build
npm run preview
```

## MongoDB Server and Compass

The backend defaults to `mongodb://127.0.0.1:27017/medflow_ai`. If the MongoDB Windows service is installed but stopped, start it from an elevated PowerShell window with `Start-Service MongoDB` (or `net start MongoDB`). If it is not installed, install MongoDB Community Server using MongoDB's official installer and start the MongoDB service.

In MongoDB Compass, connect with:

```text
mongodb://127.0.0.1:27017/medflow_ai
```

After the first admin seed, the database contains the `admins` collection. After adding a medicine through the app, the `medicines` collection appears. Admin records contain `email`, `passwordHash`, and `role`; the password hash is never returned by the API. Medicine records contain name, category, quantity, minimum stock, optional expiry date, supplier, batch, and timestamps.

## API and verification

- `GET /api/health` reports MongoDB connection state; it returns HTTP 503 while the database is unavailable.
- `POST /api/auth/login` verifies bcrypt credentials and issues a short-lived HttpOnly cookie.
- `GET /api/auth/me` verifies the current session.
- `POST /api/auth/change-password` requires the current password, hashes the new password with bcrypt, and invalidates existing sessions. The administrator can open it from the profile menu.
- `POST /api/auth/logout` clears the cookie and increments the admin token version to invalidate issued sessions.
- Authenticated medicine endpoints: `GET /api/medicines`, `GET /api/medicines/:id`, `POST /api/medicines`, `PUT/PATCH /api/medicines/:id`, and `DELETE /api/medicines/:id`.

For a quick health check, visit `http://localhost:5000/api/health`. You can test login and the protected endpoints from the frontend or an API client that retains cookies. The seed credentials stay in `backend/.env`; do not paste them into source code or commit them.

For production, set `NODE_ENV=production`, use HTTPS for the frontend and API, configure `FRONTEND_ORIGIN` to the exact frontend origin, use a strong private JWT secret, and deploy MongoDB with appropriate access controls and backups. Keep the frontend and API on the same site when using the current SameSite=Lax cookie policy; a cross-site deployment needs a deliberate SameSite=None/Secure and CSRF-protection configuration. The API currently uses secure HttpOnly cookies, strict configured-origin CORS plus unsafe-method Origin checks, login rate limiting, and server-side token-version checks. A frontend route guard does not replace authorization enforced by this API. Multi-instance production deployments should use a shared rate-limit store and operational monitoring.

## Demonstration records

The original preview records remain isolated in `src/data/demoMedicines.js`. They are not sent to MongoDB. To explicitly view them after authenticating, set `VITE_DEMO_MODE=true` in the root `.env`; add/edit/delete then affect only in-memory demo state. The default is live API mode, and API errors are shown instead of falling back to the demo list.

Inventory rules: out of stock at quantity zero or below; low stock when quantity is at or below minimum; normal stock otherwise. Expiry categories are expired, critical (30 days or fewer), warning (31–60 days), review (61–90 days), and safe (more than 90 days).
