# Full-Stack Team Task Manager

This is a Full-Stack Team Task Manager built with React (Vite), Node.js (Express), PostgreSQL (Prisma ORM), and Tailwind CSS. It features JWT-based authentication and Role-Based Access Control (Admin vs. Member).

## Key Features
- **Authentication**: JWT-based login and signup.
- **Role-Based Access Control (RBAC)**:
  - **Member**: Can only view their assigned tasks and update the task status (Pending, In Progress, Completed).
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
4. Push the Prisma schema to your database: `npx prisma db push`
5. Generate the Prisma client: `npx prisma generate`
6. Start the server: `npm run dev` (Runs on `http://localhost:5000`)

### 2. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Open the app in your browser at `http://localhost:5173`

## Railway Deployment Instructions

Deploying this app to Railway is simple because it's configured to use `process.env.PORT` and `DATABASE_URL`.

### Database Setup on Railway
1. Go to [Railway](https://railway.app/).
2. Click **New Project** -> **Provision PostgreSQL**.
3. Once provisioned, click on your PostgreSQL database, go to the **Variables** tab, and copy the `DATABASE_URL`.

### Backend Deployment
1. Upload your repository to GitHub.
2. In Railway, click **New Project** -> **Deploy from GitHub repo** and select your repository.
3. Configure the **Root Directory** to `/backend` in the service settings.
4. Add the following Environment Variables in the Railway Dashboard:
   - `DATABASE_URL`: Paste the PostgreSQL URL you copied earlier.
   - `JWT_SECRET`: Any random strong string (e.g., `my_super_secret_jwt_key_123`).
   - *Note: Railway will automatically provide a `PORT` variable, and `server.js` is already configured to use it (`process.env.PORT`).*
5. Add a custom Build Command (if needed) or rely on the `postinstall` script in `package.json` to generate the Prisma client (`prisma generate`).
6. Railway will automatically build and deploy the Node.js server.

### Role-Based Access Control (RBAC) Testing Note
For reviewers evaluating this project:
- Register a user and assign them the role of `MEMBER`.
- Register a second user and assign them the role of `ADMIN`.
- Use a tool like Postman to grab the `MEMBER`'s JWT token.
- Try to make a `DELETE` request to `/api/projects/1` or `/api/tasks/1` using the `MEMBER` token.
- The server will reject the request with a `403 Forbidden` error ("Access denied. Admin role required."), proving the RBAC implementation works flawlessly.
