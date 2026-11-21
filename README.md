# 🏫 Smart School Connect

> **AI-Powered School Communication, Task Assignment, and Academic Progress Platform**  
> Designed for **Teachers** (or co-mentors/staff), **Parents**, and **Students**.

---

## 🌟 Executive Summary & Highlights

**Smart School Connect** is a responsive, full-stack school communication and task management platform built to streamline academic workflows across teachers, parents, and students. Based on the domain flow and UI architecture in `Smart_School_Connect_Architect_UI_Brief.pdf`, the system provides:

1. **Role-Based Workspaces**: Scoped views for **Teacher**, **Parent**, and **Student**, with strict role isolation and data access policies.
2. **Unified Login & Student PIN Access**: Standard `email` + `password` authentication for staff and parents, plus a dedicated **4-digit PIN access flow** for students (accessible from the login screen or parent dashboard).
3. **Teacher Task Creation & Management**: Real CRUD persistence in MongoDB with subject, class/grade, priority, instructions, and due dates.
4. **Parent Task Batching & Sequencing**: Allows parents to organize larger homework lists into sequential batches (e.g., releasing Batch 1 first, keeping Batch 2 locked until completion) to prevent student overload.
5. **Student To-Do & Progress Tracking**: Interactive task view with `All`, `Pending`, and `Completed` filters, study time tracking (in minutes), student reflection notes, and instant MongoDB status synchronization.
6. **Teacher-to-Parent Messaging with Mandatory Human Review**: AI message rewriting with tone controls (Encouraging, Clear & Direct, Urgent Reminder), editable preview modal, and **mandatory teacher review and approval** before delivery.
7. **AI-Powered Academic Digest for Educators & Parents**: Summarizes student task completion rates, average time spent, pending work, overdue alerts, and communication history without reading raw logs.
8. **Interactive "Ask School AI" Assistant**: Chat interface supporting **Groq (Llama-3.3-70b)**, **Google Gemini**, and **NVIDIA Nemotron**, grounded strictly in MongoDB school records with graceful offline fallback.

---

## 🏗️ Architecture & Engineering Principles

The application adheres strictly to **Single Responsibility Principle (SRP)**, **DRY**, **KISS**, and the **Controller → Service → Repository** pattern:

```
Smart School Connect/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # Mongo connection (supports MongoMemoryServer + external URI)
│   │   │   └── env.js                # Server-only environment configuration
│   │   ├── models/
│   │   │   ├── User.js               # User model (roles, student PIN, parent-child links)
│   │   │   ├── Task.js               # Homework task model with status, notes, time spent
│   │   │   ├── TaskBatch.js          # Parent workload sequencing and batching
│   │   │   └── Message.js            # Communications model with AI rewrite & review flags
│   │   ├── repositories/             # Data access layer (Mongoose queries only)
│   │   │   ├── userRepository.js
│   │   │   ├── taskRepository.js
│   │   │   ├── taskBatchRepository.js
│   │   │   └── messageRepository.js
│   │   ├── services/                 # Business logic & permission verification
│   │   │   ├── authService.js
│   │   │   ├── taskService.js
│   │   │   ├── messageService.js
│   │   │   ├── aiService.js
│   │   │   └── ai/                   # AI Provider Adapters & Multi-Provider Fallback Engine
│   │   │       ├── groqAdapter.js    # Groq Llama-3.3-70b adapter
│   │   │       ├── geminiAdapter.js  # Google Gemini Flash adapter
│   │   │       ├── nvidiaAdapter.js  # NVIDIA Nemotron-4-340B adapter
│   │   │       └── aiOrchestrator.js # Multi-provider fallback & grounded contextual engine
│   │   ├── controllers/              # HTTP request handling & status codes
│   │   │   ├── authController.js
│   │   │   ├── taskController.js
│   │   │   ├── messageController.js
│   │   │   └── aiController.js
│   │   ├── middleware/               # Auth, Role, and Error middlewares
│   │   │   ├── authMiddleware.js     # JWT token verification
│   │   │   ├── roleMiddleware.js     # Role-based route authorization
│   │   │   └── errorMiddleware.js    # Centralized JSON error handler
│   │   ├── routes/                   # Express API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── aiRoutes.js
│   │   ├── utils/
│   │   │   └── seedData.js           # Auto-seeding initial users, tasks, batches, and updates
│   │   ├── app.js                    # Express app setup & static frontend serving
│   │   └── server.js                 # Server entrypoint
│   ├── test-e2e.js                   # Automated E2E test verification suite
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Navbar, Sidebar, Badge, Modal, LoadingSpinner, EmptyState
│   │   │   ├── auth/                 # StudentPinModal (keypad PIN authentication)
│   │   │   ├── tasks/                # TaskCreateModal, TaskBatchManager
│   │   │   ├── messages/             # TeacherMessageComposer, AIDraftReviewModal
│   │   │   └── ai/                   # AIAssistantChat, AISummaryCard
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state, session persistence, role switcher
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Unified login & quick demo switcher (PDF Screen 01)
│   │   │   ├── TeacherDashboard.jsx  # Teacher overview & classroom metrics
│   │   │   ├── ParentDashboard.jsx   # Parent child overview & batching shortcuts
│   │   │   ├── StudentDashboard.jsx  # Student school day overview (PDF Screen 02)
│   │   │   ├── HomeworkTasksPage.jsx # Homework & To-Do with filters (PDF Screen 03/05)
│   │   │   ├── MessagesPage.jsx      # Parent-teacher communication (PDF Screen 04)
│   │   │   └── AIAssistantPage.jsx   # "Ask School AI" assistant (PDF Screen 05)
│   │   ├── services/                 # Dedicated Axios API modules
│   │   │   ├── api.js                # Axios instance with JWT interceptor
│   │   │   ├── authService.js
│   │   │   ├── taskService.js
│   │   │   ├── messageService.js
│   │   │   └── aiService.js
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── package.json
```

---

## 🤖 Multi-Provider AI Layer & Automatic Fallback Engine

All AI API keys remain **strictly on the backend** in `backend/.env`.

- **Primary & Secondary Cloud Providers**:
  - **Groq**: High-speed, generous free-tier `llama-3.3-70b-versatile`.
  - **Google Gemini**: Reliable `gemini-1.5-flash` model.
  - **NVIDIA Nemotron**: `nvidia/nemotron-4-340b-instruct` OpenAI-compatible endpoint.
- **Cascading Fallback Mechanism**:
  If a provider experiences rate limits, timeouts, or network blocks, the `AIOrchestrator` automatically cascades to the next configured provider.
- **Contextual Demo Engine (Zero-Failure Guarantee)**:
  If no external API keys are configured, the backend automatically uses an intelligent, grounded fallback engine that analyzes real MongoDB tasks, deadlines, and tones. This guarantees the live presentation **never errors or crashes during evaluations**.

---

## 👥 Seed Accounts & Demo Credentials

When the server starts, it automatically seeds realistic records matching the project brief:

| Role | Email / Access | Password / PIN | Description |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@school.com` | `password123` | Grade 8 Teacher (Ms. Taylor). Creates tasks, reviews AI drafts, sends updates. |
| **Parent** | `parent.sarah@school.com` | `password123` | Parent (Sarah Johnson). Organizes Alex's task batches, views AI progress digests. |
| **Student** | **Alex Johnson** | PIN: `1234` | Grade 8 Student. Accessible via **PIN keypad** on login or parent dashboard. |

> 💡 **Demo Shortcut**: The login page and navigation bar include **1-Click Demo Profile Switchers** so you can jump between Teacher, Parent, and Student modes without retyping credentials.

---

## 🚀 Quickstart & Running Instructions

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 tested)
- **MongoDB**: Optional! The backend includes an embedded `MongoMemoryServer` that starts automatically if no external MongoDB URI is provided. If you have an external MongoDB instance, simply set `MONGODB_URI` in `backend/.env`.

### 2. Install Dependencies
```bash
npm run install:all
```
*(Or run `cd backend && npm install` and `cd ../frontend && npm install`)*

### 3. Start the Full Application

#### Option A: Unified Server (Serves API + Built Frontend on port 5000)
```bash
# 1. Build the frontend
npm --prefix frontend run build

# 2. Start the backend server
node backend/src/server.js
```
Open **`http://localhost:5000`** in your browser!

#### Option B: Development Mode (Vite HMR on port 5173 + Backend on port 5000)
- **Terminal 1 (Backend):**
  ```bash
  cd backend
  npm run dev
  ```
- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```
Open **`http://localhost:5173`** in your browser!

---

## 🧪 Automated End-to-End Verification

An automated test suite validates the entire API, database seeding, auth roles, student PIN, task updates, AI rewriting, AI progress digest, and Ask School AI:

```bash
# While the backend is running:
node backend/test-e2e.js
```

**Test Results:**
```
--- Starting Smart School Connect End-to-End Verification ---
Server is ready after 6 attempt(s)!

1. Checking API Health...
Status: 200, Response: { status: 'online', app: 'Smart School Connect API' }

2. Testing Teacher Login (teacher@school.com)...
Status: 200, Role: teacher, Name: Ms. Taylor

3. Testing Student PIN Login (PIN: 1234)...
Status: 200, Role: student, Name: Alex Johnson

4. Fetching Tasks for Student Alex...
Status: 200, Count: 3
Tasks retrieved: [ 'Science - Quiz Prep [completed]', 'Math - Fractions [pending]', 'Science - Chapter 4 [pending]' ]

5. Testing AI Draft Rewriting (Teacher -> AI)...
Status: 200, Provider: Smart School Contextual AI Engine (Local Fallback)

6. Testing AI Student Digest Generation...
Status: 200, Provider: Smart School Contextual AI Engine (Local Fallback)

7. Testing Ask School AI Assistant ("Summarize my homework for tomorrow")...
Status: 200, Provider: Smart School Contextual AI Engine (Local Fallback)
Assistant Output:
 Here is your upcoming homework summary:
 • Math - Fractions (Mathematics) due 21/11/2026
 • Science - Chapter 4 (Science) due 22/11/2026
 • English - Essay (English) due 24/11/2026

8. Testing Web UI Static Serving (GET /)...
Status: 200, Content-Type: text/html; charset=UTF-8

=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===
```

---

## 🔒 Security & Privacy Notice
- Student and parent records are scoped strictly via authorized parent-child links in MongoDB.
- Student accounts cannot access teacher administrative endpoints (enforced via `roleMiddleware`).
- All AI queries filter context strictly to the authenticated user's authorized class and child records.
- API keys are never leaked to client bundles or network requests.
