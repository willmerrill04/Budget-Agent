# Carpentry Manager

A mobile-friendly web app for managing a carpentry business — leads, jobs, expenses, and profit tracking.

## Tech Stack

- **Frontend**: React + Vite (port 3000)
- **Backend**: Node.js + Express + SQLite (port 3001)

## Features

- **Dashboard** — Active job count, total profit from paid jobs, overdue leads highlighted in red
- **Leads** — Add leads with name, phone, description, and date called; convert leads to jobs
- **Jobs** — Full job tracking with status (Booked / In Progress / Complete / Invoiced / Paid), quote amount, expenses, and automatic profit calculation

## Running Locally

### 1. Install dependencies

```bash
# From the project root
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the backend

```bash
cd backend && npm run dev
# Runs on http://localhost:3001
```

### 3. Start the frontend

```bash
cd frontend && npm run dev
# Runs on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

## Accessing from your Android phone

Make sure your phone is on the same Wi-Fi network as your computer, then open:

```
http://<YOUR-COMPUTER-IP>:3000
```

To add it to your home screen like an app:
1. Open the URL in Chrome on your phone
2. Tap the three-dot menu → **Add to Home screen**

## Project Structure

```
carpentry-app/
├── backend/
│   ├── server.js          # Express server
│   ├── db.js              # SQLite database setup
│   └── routes/
│       ├── leads.js
│       ├── jobs.js
│       └── dashboard.js
└── frontend/
    ├── vite.config.js     # Proxies /api to backend
    └── src/
        ├── App.jsx        # Root with nav
        ├── api.js         # Axios API calls
        └── pages/
            ├── Dashboard.jsx
            ├── Leads.jsx
            ├── Jobs.jsx
            └── JobDetail.jsx
```
