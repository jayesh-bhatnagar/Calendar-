# Calendar App

A beginner-friendly MERN calendar project. The repository keeps the React frontend in `client/` and the Express/Mongoose backend in `server/`.

## Requirements

- Node.js 22.12 or newer (Node.js 24 LTS is recommended)
- npm (included with Node.js)
- MongoDB Community Server running locally, or a MongoDB Atlas cluster

## Install dependencies

Run these commands from the project root:

```sh
npm install --prefix client
npm install --prefix server
```

Each application has its own `package.json` and `node_modules`. A Python virtual environment is not used because it does not manage Node.js packages.

## Configure MongoDB

Copy the example environment file to a local `.env` file.

PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Git Bash or another POSIX shell:

```sh
cp server/.env.example server/.env
```

For MongoDB Community Server running on your computer, the example URI is ready to use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/calendar_app
PORT=5000
```

Make sure the local MongoDB service is running before starting the backend. For MongoDB Atlas, replace `MONGODB_URI` in `server/.env` with your cluster connection string. Keep the real URI private; `.env` files are ignored by Git.

## Run the project

Open two terminals at the project root.

Terminal 1, backend:

```sh
npm run dev:server
```

Terminal 2, frontend:

```sh
npm run dev:client
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Check the backend

Open `http://localhost:5000/api/health`, or run this in PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

When MongoDB is connected, the endpoint returns HTTP 200 with a response like:

```json
{
  "status": "ok",
  "api": "available",
  "database": {
    "status": "connected"
  }
}
```

If the API is running but MongoDB is unavailable, the endpoint returns HTTP 503 and reports the database state instead of claiming the whole service is healthy. The server logs the connection error. Check that MongoDB is running and that `server/.env` contains a valid URI.

## Event API

All event routes are under `/api/events` and require a connected MongoDB database.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/events` | List events, ordered by start time |
| `GET` | `/api/events/:id` | Get one event |
| `POST` | `/api/events` | Create an event |
| `PUT` | `/api/events/:id` | Replace an event's editable fields |
| `PATCH` | `/api/events/:id/status` | Set an allowed event status |
| `PATCH` | `/api/events/:id/reschedule` | Change event time and preserve its original time |
| `DELETE` | `/api/events/:id` | Delete an event |

The list endpoint accepts optional inclusive date filters. A date-only `end` includes that entire UTC day:

```text
GET /api/events?start=2026-09-01&end=2026-09-30
```

Create and update requests use JSON with `title` and `startAt`; `description` is optional. For example:

```json
{
  "title": "Study DBMS",
  "description": "Revise normalization",
  "startAt": "2026-09-29T18:00:00.000Z"
}
```

The server returns `400` for invalid input or IDs, `404` when an event does not exist, `409` when an expired event is locked, and `503` when MongoDB is unavailable. Successful creation returns `201`, reads and updates return `200`, and deletion returns `204` with no response body.

Statuses accepted by the status endpoint are `scheduled`, `completed`, `missed`, and `rescheduled`. Use the reschedule endpoint when changing an event's time; it sets the status to `rescheduled` and keeps the first scheduled time in `originalStartAt`.

Events in `scheduled` or `rescheduled` status become `missed` once their start time passes. The API updates expired events during reads, and the open frontend refreshes at the next event deadline and when the tab becomes visible again. Expired events have their actions disabled; API attempts to edit, delete, complete, or reschedule them return `409`. Rescheduling must happen before the current start time and use a future time.

## Test the API

With MongoDB configured in `server/.env`, run:

```sh
npm --prefix server test
```

The integration test creates a temporary event, checks the CRUD and validation behavior, and deletes its test data. It requires a reachable MongoDB database.

## Current milestone

Milestone 6 completes the responsive calendar and event workflow with loading, error, empty, accessibility, and validation feedback. Notifications remain out of scope.