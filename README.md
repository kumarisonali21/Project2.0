# Full-Stack Team Task Manager

This is a Full-Stack Team Task Manager built with React (Vite), Node.js (Express), PostgreSQL (Prisma ORM), and Tailwind CSS. It features JWT-based authentication and Role-Based Access Control (Admin vs. Member).

## Key Features
- **Authentication**: JWT-based login and signup.
- **Role-Based Access Control (RBAC)**:
  - **Member**: Can only view their assigned tasks and update the task status.
  - **Admin**: Can create, edit, and delete any tasks and projects.
- **Dashboard**: Shows metrics like "Total Tasks", "Completed", and "Overdue".

## Directory Structure
- `/backend`: Node.js, Express, Prisma, PostgreSQL.
- `/frontend`: React, Vite, Tailwind CSS.

## Local Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `backend` folder and add:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   JWT_SECRET="your_secret_key"
   PORT=5000
   ```
4. Push the Prisma schema to your database: `npm run db:push`
5. Generate the Prisma client: `npm run generate`
6. Start the server: `npm run dev` (Runs on `http://localhost:5000`)

### 2. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Open the app in your browser at `http://localhost:5173`

## Railway Deployment Instructions

### Backend Deployment
1. Go to [Railway](https://railway.app/) and log in with GitHub.
2. Click **New Project** -> **Deploy from GitHub**.
3. Select your repository `Project2.0`.
4. Set the service root to `backend`.
5. Add these environment variables in Railway:
   - `DATABASE_URL`: Railway PostgreSQL connection string.
   - `JWT_SECRET`: Strong random string.
6. Leave the start command as `npm run start`.
7. Railway will automatically install dependencies and run the app.

### Notes for Railway
- The backend already uses `process.env.PORT`.
- `backend/package.json` includes Prisma scripts and generation commands.
- If you use Railway PostgreSQL, make sure `DATABASE_URL` is set in Railway.

## Deployment Commands
From the repo root, you can also run:
- `npm run db:push`
- `npm run migrate:dev`
- `npm run generate`

These commands are forwarded to `backend`.

## Env Example
See `backend/.env.example` for the exact required variables.

