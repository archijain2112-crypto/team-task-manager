# TaskFlow 🚀

TaskFlow is a production-ready, full-stack Team Task Manager optimized for rapid local development and seamless single-service deployment on Railway.

Built using **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, and **MongoDB Atlas**, it implements a beautiful Obsidian-slate dark-themed Kanban board with strict role-based access rules and active telemetry dashboards.

---

## Key Features

1. **Authentication**: Secure cookie-based JWT sessions (using edge-compatible `jose` tokenizers) supporting signups, logins, and logouts.
2. **Interactive Telemetry Dashboard**: Real-time project diagnostics built with Recharts, displaying status distributions, contributor charts, and highlighted overdue warnings.
3. **Kanban workspace Boards**: A three-lane status tracker (To Do, In Progress, Completed) featuring live text search and filters by priority or assignee.
4. **Strict Authorization Guards**:
   - **Project Admins**: Can invite or delete members, remove tasks, delete projects, and update all task fields.
   - **Project Members**: Can view projects, create tasks, and **only** edit progress states (`status` field) of tasks explicitly assigned to them.
5. **Seeded Demo Accounts**: Immediate local exploration with pre-populated tasks, priorities, and roles.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide icons, React Hook Form, Axios.
- **Backend API**: Next.js Server-Side API Routes, Prisma 7, bcryptjs, JWT.
- **Database**: MongoDB Atlas.
- **Deployment**: Railway (Single-service NIXPACKS template).

---

## Local Setup & Quickstart

Follow these simple steps to run the application locally:

### 1. Clone & Install Dependencies
Ensure you run with peer dependency flags to align React 19 libraries cleanly:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Create a local `.env` file in the root directory:
```bash
cp .env.example .env
```
Open `.env` and fill in:
* `DATABASE_URL`: Your MongoDB Atlas connection string.
* `JWT_SECRET`: A secure cryptographically random key.

### 3. Generate Prisma Typings
Synchronize database models and generate client bindings:
```bash
npx prisma generate
```

### 4. Seed the Database
Execute our commonjs seeder script to clean old entries and populate sample data:
```bash
node seed.js
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## Seeded Login Credentials

Explore role-based authorization immediately using these pre-seeded accounts (password is `password123` for both):

* **Project Administrator Role**:
  - Email: `admin@example.com`
  - Password: `password123`
  - *Abilities: Can add/remove members, update all fields of any task, delete tasks, and delete projects.*

* **Project Member Role**:
  - Email: `member@example.com`
  - Password: `password123`
  - *Abilities: Can view dashboard metrics, add tasks, and ONLY update the status state of tasks explicitly assigned to them.*

---

## Single-Service Railway Deployment

To deploy TaskFlow on Railway in under 10 minutes:

1. **Create a Railway Project**: Select **Deploy from GitHub repository** and link your clone.
2. **Add Environment Variables**:
   - `DATABASE_URL` (Your MongoDB Atlas URI)
   - `JWT_SECRET` (Your random session string)
3. **Deploy**: Railway automatically reads `railway.json`, compiles Next.js using Nixpacks, runs building steps, and binds your server!
