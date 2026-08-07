# AMC 2027 Conference Registration Website

Full-stack conference registration and payment website for the **Africa Methodist Council (AMC) 3rd General Conference 2027**, March 9–14, 2027 in Harare, Zimbabwe.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router v6, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MySQL with `mysql2` driver |
| Auth (Admin) | Clerk |
| Payments | Paynow Zimbabwe SDK |
| Email | Resend |

---

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- A [Clerk](https://clerk.com) account (free tier works)
- A [Paynow Zimbabwe](https://www.paynow.co.zw) merchant account
- A [Resend](https://resend.com) account with a verified sending domain

---

## 1. Database Setup

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE amc_conference_2027 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations in order
mysql -u root -p amc_conference_2027 < server/db/migrations/001_init.sql
mysql -u root -p amc_conference_2027 < server/db/migrations/002_admins.sql
mysql -u root -p amc_conference_2027 < server/db/migrations/003_content.sql
```

---

## 2. Environment Variables

```bash
# In the project root
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL credentials |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | From Clerk Dashboard → API Keys |
| `PAYNOW_INTEGRATION_ID` / `PAYNOW_INTEGRATION_KEY` | From Paynow → Account → Integration |
| `PAYNOW_RESULT_URL` | Public URL Paynow POSTs payment updates to (must be HTTPS) |
| `PAYNOW_RETURN_URL` | URL user is redirected to after web payment |
| `RESEND_API_KEY` | From Resend → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender email on Resend |
| `ADMIN_NOTIFICATION_EMAIL` | Admin inbox for new registration alerts |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY` |

> **Note for development:** `PAYNOW_RESULT_URL` must be a publicly accessible HTTPS URL. Use [ngrok](https://ngrok.com) to expose your local server: `ngrok http 5000`

---

## 3. Server Setup

```bash
cd server
npm install
npm run dev        # Development with nodemon
# OR
npm start          # Production
```

Server starts on `http://localhost:5000`.

Health check: `GET http://localhost:5000/api/health`

---

## 4. Client Setup

```bash
cd client
npm install
npm run dev        # Development server
# OR
npm run build      # Production build
npm run preview    # Preview production build
```

Client starts on `http://localhost:5173`.

---

## 5. Clerk Setup

1. Create a new application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy **Publishable Key** → `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY`
3. Copy **Secret Key** → `CLERK_SECRET_KEY`
4. Under **User & Authentication → Email, Phone, Username**, enable email/password
5. Admin users must be invited manually through the Clerk Dashboard

---

## 6. Paynow Setup

1. Create a merchant account at [paynow.co.zw](https://www.paynow.co.zw)
2. Go to **Account → Integrations** and create a new integration
3. Copy the **Integration ID** and **Integration Key**
4. Set the **Result URL** to your `PAYNOW_RESULT_URL` (must be HTTPS)
5. For EcoCash/Telecash, ensure your account has mobile money enabled

---

## 7. Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain (e.g., `africamethodistcouncil.org`)
3. Create an API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified address on your domain

---

## Project Structure

```
AMCRegistrationSite/
├── client/           # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Reusable UI, layout, registration, admin
│   │   ├── pages/        # Route-level page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # API client, utilities
│   └── ...
├── server/           # Node.js + Express backend
│   ├── config/       # Database connection
│   ├── middleware/   # Clerk auth, error handler
│   ├── routes/       # API route handlers
│   ├── services/     # Paynow, Resend, business logic
│   └── db/migrations/  # SQL schema files
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/registrations` | Submit new registration |
| GET | `/api/registrations/:ref` | Get registration by ref |
| POST | `/api/payments/initiate` | Initiate Paynow payment |
| GET | `/api/payments/poll/:paymentId` | Poll payment status |
| POST | `/api/payments/paynow-result` | Paynow webhook |
| GET | `/api/admin/stats` | Dashboard stats (auth required) |
| GET | `/api/admin/registrations` | List registrations (auth required) |
| PATCH | `/api/admin/registrations/:id/status` | Update status (auth required) |
| GET | `/api/admin/payments` | List payments (auth required) |
| GET | `/api/admin/export/csv` | Export CSV (auth required) |
| GET/PATCH | `/api/admin/settings` | Conference settings (auth required) |

---

## Registration Fees

| Category | Fee (USD) |
|----------|-----------|
| Delegate | $150 |
| Observer | $100 |
| Invited Guest | $120 |
| Accommodation | $80/night |

---

## License

Private — Africa Methodist Council. All rights reserved.
