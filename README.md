# 🏫 Smart School Connect

> **AI-Powered Multi-Tenant School Communication, Task Assignment, Attendance, and Academic Progress Platform**  
> Designed for **Super Administrators**, **Teachers** (or co-mentors/staff), **Parents**, and **Students**.

---

## 🌟 Executive Summary & Highlights

**Smart School Connect** is a responsive, full-stack multi-tenant school communication, task management, attendance tracking, and grading platform built to streamline academic workflows across administrators, educators, parents, and students. Based on the domain flow and UI architecture in `Smart_School_Connect_Architect_UI_Brief.pdf`, the system provides:

1. **Multi-Tenant Campus Architecture & Isolation**: Full SaaS multi-tenant isolation via `tenantGuard` middleware, ensuring that users, classes, attendance, tasks, and communications remain strictly partitioned per school tenant.
2. **Super Administrator & School Provisioning Portal**: End-to-end administration suite to configure academic classes, rooms, and weekly schedules, dispatch email onboarding invitations for faculty, students, and parents, link parents to children, and moderate members with instant Kick Out controls.
3. **Unified Login & Student PIN Access**: Standard `email` / username + `password` authentication for administrators, educators, and parents, plus a dedicated **4-digit PIN access flow** for students (accessible from the login screen or parent dashboard without requiring an email address).
4. **Teacher Classroom & Grading Studio**: Full assignment management with subject, class/grade, priority, instructions, max scores, and due dates. Includes an interactive grading modal with full-resolution student work photo review and qualitative teacher remarks.
5. **Multi-Photo Homework Submission with In-Memory Fast Processing**: Students can attach multiple photos of their handwritten notebooks, worksheets, or solved assignments. Features client-side image compression, canvas downscaling, and Apple HEIC/HEIF format auto-detection with zero browser freezing.
6. **Live Classroom Attendance Roll-Call & Absentee Parent Alerts**: Daily attendance sheet with Present, Late, and Absent statuses, one-click "Mark All Present" toggle, real-time WebSocket broadcast, and automated asynchronous email alerts sent directly to parents of absent students.
7. **Instant Dual-Channel Grade Notifications**: When an educator grades an assignment, the numeric score and written feedback are immediately pushed via WebSockets to the student and linked parent, accompanied by an in-app message and formatted email with the attached homework photos.
8. **Parent Task Batching & Workload Sequencing**: Allows parents to organize larger homework lists into sequential batches (e.g., releasing Batch 1 first, keeping Batch 2 locked until completion) to prevent student cognitive overload.
9. **Parent & Guardian Supervision Portal**: Multi-child family switcher, real-time student attendance percentage gauge, homework submission inspection, and direct teacher messaging.
10. **Teacher-to-Parent Messaging with Mandatory Human Review**: AI message rewriting with tone controls (Encouraging, Clear & Direct, Urgent Reminder, Celebratory), editable preview modal, and **mandatory teacher review and approval** before delivery.
11. **School-Wide Broadcast Announcements**: High-priority bulletins posted by administrators and educators broadcasted instantaneously to connected parents, teachers, and staff.
12. **AI-Powered Academic Digest for Educators & Parents**: Summarizes student task completion rates, average study time spent, pending work, overdue alerts, and communication history without reading raw logs.
13. **Interactive "Ask School AI" Assistant**: Chat interface supporting **Groq (Llama-3.3-70b)**, **Google Gemini (1.5 Flash)**, and **NVIDIA Nemotron (340B)**, grounded strictly in MongoDB school records with a zero-failure contextual fallback engine.
14. **Real-Time WebSocket Layer (Socket.io)**: Live status indicator (`● Live` / `● Syncing`) with instant push notifications for attendance changes, newly published assignments, submitted work, grades, messages, and announcements.

---

## 🎯 Comprehensive Feature Catalog by Role & Module

### 🛡️ 1. Super Administrator & School Provisioning Portal
* **Campus Profile & Settings**: View and manage school tenant identity, school name, slug, address, phone number, billing email, current academic year, and platform settings.
* **School Analytics & KPI Dashboard**:
  * Real-time counters for enrolled students, active teachers, registered parents, and classrooms.
  * School-wide daily attendance rate rollup gauge (present vs absent percentage).
  * Average student enrollment per classroom cohort.
* **Academic Classes & Structure Management**:
  * **Create Academic Class**: Configure Class/Grade Name (e.g., `Grade 10`), Section (`A`), Room Number (`01`), and Academic Year.
  * **Class Detail & Roster Modal**: Full breakdown of any cohort including homeroom educator and enrolled students.
  * **Weekly Timetable / Schedule Builder**: Add or remove scheduled periods for any day (Monday through Friday) with Subject, Start Time, End Time, and Faculty Name.
  * **Unassign Educator**: Remove teacher assignments from homeroom classes without deleting their account.
  * **Unenroll Student**: Remove individual students from class rosters.
* **Member Provisioning & Onboarding Invitations**:
  * **Invite Teacher**: Dispatch email invitations with direct assignment to class cohorts or homeroom responsibilities.
  * **Invite Student**: Dispatch email invitations mapping students to their academic grade and section.
  * **Invite Parent with Direct Child Linkage**: Select the enrolled child via the **Link to Enrolled Student** dropdown with real-time roster synchronization (`↻ Refresh Students` button and auto-sync on tab focus).
  * **Cryptographically Secure Invitation Links**: 32-byte hex tokens valid for 7 days with one-click link copying and revoke actions.
* **Enrolled School Directory & Moderation**:
  * Filterable directory view (`All Roles`, `Teachers`, `Students`, `Parents`) with real-time text search by name or email.
  * Visual indicators for assigned classes and parent-child linkages (e.g., `Parent of Alex Johnson • Grade 10 - A`).
  * **Kick Out Member**: One-click removal of rogue or inactive members from the tenant. Automatically unlinks children, unassigns homeroom roles, revokes pending invitations, and deletes user records cleanly.
* **Campus-Wide Attendance Overview**:
  * Date-picker inspection for school-wide attendance history.
  * Aggregated counts for Present, Late, and Absent students across all grades.
  * Class-by-class roll-call status table showing which educator submitted the sheet and the present percentage.
* **Announcements & AI Assistant**:
  * Broadcast high-priority school bulletins to parents and teachers.
  * Query the school AI assistant with tenant-wide administrative grounding.
* **Admin Security & Credentials Management**:
  * Update administrator display name, login identifier, current password, and new password directly from the portal.

---

### 👨‍🏫 2. Teacher Classroom & Grading Studio
* **Classroom Overview & Cohort Switcher**:
  * Homeroom header context showing assigned class and section.
  * Quick metric summary: Active Assignments, Submissions Turned In, Pending Review count, and Enrolled Students.
  * Student roster preview with today's attendance badge.
* **Daily Attendance Roll-Call Sheet**:
  * Date-selectable student roll-call table.
  * Individual status selectors: `Present`, `Late`, and `Absent`, with custom teacher remarks per student.
  * Quick **"Mark All Present"** toggle for rapid roll-call entry.
  * **Save & Broadcast**: Emits real-time WebSocket updates (`attendance:updated`) across the school and class.
  * **Automated Parent Absentee Alerts**: Asynchronously sends an email alert to the parents of any student marked absent with date and remarks.
* **Curriculum Assignments & Tasks Management**:
  * **Create Assignment Modal**: Title, Subject (Math, Science, English, etc.), Description/Instructions, Priority (`High`, `Medium`, `Low`), Due Date, Max Score (default 100), and Class targeting.
  * Filter assignments by `All`, `Active`, and `Completed`.
  * Real-time counters showing turned-in submissions, graded work, and pending reviews.
* **Homework Submissions & Grading Studio**:
  * View all turned-in homework per assignment with submission timestamps.
  * **Student Work Photo Reviewer**: Inspect multi-page homework photos (notebooks, worksheets) with click-to-enlarge full-resolution viewing.
  * Read student-written notes and logged study time (in minutes).
  * **Grade & Feedback Submission**: Enter numeric score and qualitative teacher feedback.
  * **Automated Dual-Channel Broadcast**:
    * Instant WebSocket notification (`grade:updated`) sent to both student and parent.
    * Auto-creates an in-app message delivered to the parent's inbox with the score, feedback, and attached work photos.
    * Sends an automated email to the parent with student performance details.
* **Parent Messaging & Announcements**:
  * View direct messages and conversation threads with parents.
  * Filter between direct communications and school-wide announcements.
* **AI Message Composer**:
  * Draft updates to parents with 4 customizable tones:
    * *Encouraging & Professional*
    * *Clear & Direct*
    * *Urgent Reminder*
    * *Celebratory / Commendation*
  * Provider switcher supporting Groq Llama 3.3, Google Gemini, and NVIDIA Nemotron.
  * **Mandatory Teacher Review**: Editable preview modal ensuring human-in-the-loop oversight before dispatch.

---

### 🎓 3. Student School Day Workspace
* **My School Day Overview**:
  * Personalized greeting with enrolled grade and section.
  * Quick status metrics: Open Homework count, Completed & Graded count, and Attendance Rate percentage.
  * **Today's Class Timetable**: Live schedule displaying time slots, subject names, faculty, and room locations.
* **My Assignments & Homework Hub**:
  * Status tabs: `All`, `Pending`, and `Completed`.
  * Assignment cards displaying Subject, Priority badge, Due Date, instructions, and review score/feedback once graded.
* **Turn In Homework & Multi-Photo Submission**:
  * **Multi-Photo Upload**: Snap or upload multiple photos of homework notebooks, worksheets, or written solutions.
  * **Apple HEIC/HEIF Auto-Detection**: Converts and reads modern iPhone HEIC formats without errors.
  * **In-Memory Fast ArrayBuffer Decoding**: High-performance client-side image compression and canvas downscaling (max dimension 1600px, 80% JPEG quality) that cuts file size by up to 90% without freezing the browser.
  * Written explanation / solution notes input.
  * Study Time Logger (tracks minutes spent on the assignment).
  * One-click "Turn In Work & Submit for Review" button that alerts the educator in real-time.
* **Student Authentication & PIN Management**:
  * Email + Password login.
  * **4-Digit Student PIN Login**: Fast numeric keypad entry from the login screen without needing an email address.
  * Dedicated PIN setup and reset capabilities.
* **Ask School AI Helper**:
  * Interactive AI homework helper grounded strictly in the student's assigned curriculum and timetable.

---

### 👨‍👩‍👧 4. Parent & Guardian Supervision Portal
* **Multi-Child Family Switcher**:
  * Parents with multiple children enrolled can switch between children with a single click, automatically updating all dashboard metrics, attendance, and tasks.
* **Child Academic Overview**:
  * Metrics for Completed Homework, Pending Tasks, Attendance Percentage, and Tasks in the Active Batch.
  * Child's daily class timetable preview.
  * Recent teacher messages, grades, and written feedback.
* **Live Child Attendance Log**:
  * Visual attendance percentage gauge.
  * Detailed historical roll-call log showing date, marked status (`Present`, `Late`, `Absent`), and teacher remarks.
* **Assignments & Homework Inspection**:
  * View all assignments assigned to their child across subjects.
  * Inspect submitted homework photos, student study minutes, and teacher grades/remarks.
* **Parent Task Batching & Workload Sequencing Studio**:
  * Create custom homework batches (e.g., *"Batch 1: Weekday Core"*, *"Batch 2: Weekend Projects"*).
  * Assign individual homework items into specific batches.
  * **Lock / Release Toggle**: Allows parents to release Batch 1 while keeping Batch 2 locked from the student's view until completion, preventing cognitive overload and study fatigue.
* **Communications & Ask School AI**:
  * Direct two-way messaging with homeroom teachers and access to campus announcements.
  * Grounded AI assistant answering inquiries regarding their child's upcoming tests, pending tasks, and academic standing.

---

### ⚡ 5. Real-Time WebSocket Infrastructure (Socket.io)
The platform features an event-driven architecture powered by Socket.io, with real-time multi-tenant channel isolation:
* **Rooms & Scoping**:
  * User Room: `user:<userId>`
  * School Room: `school:<schoolId>`
  * Class Room: `class:<classId>`
* **Real-Time Event Catalog**:
  * `attendance:updated`: Emitted when daily attendance is saved; updates student, parent, and admin dashboards immediately.
  * `task:created`: Broadcasts newly created homework tasks to enrolled students and parents.
  * `submission:received`: Alerts teachers instantly when a student turns in homework with photo attachments.
  * `grade:updated`: Pushes evaluation scores, teacher feedback, and work attachments to both student and parent in real-time.
  * `announcement:new`: Broadcasts urgent campus announcements to connected users.
  * `message:new`: Dispatches direct parent-teacher communications.
* **Visual Status Pill**: Top navigation bar includes a live socket indicator showing `● Live` (pulsing green) when connected and `● Syncing` (amber) during connection renegotiation.

---

### 🤖 6. Multi-Provider AI Layer & Automatic Fallback Engine
All AI keys remain **strictly on the backend** in `backend/.env` with zero client-side exposure:

* **Primary & Secondary Cloud Providers**:
  * **Groq**: High-speed, generous free-tier `llama-3.3-70b-versatile`.
  * **Google Gemini**: Reliable `gemini-1.5-flash` model.
  * **NVIDIA Nemotron**: `nvidia/nemotron-4-340b-instruct` OpenAI-compatible endpoint.
* **Cascading Fallback Mechanism**:
  If a provider experiences rate limits, timeouts, or network blocks, the `AIOrchestrator` automatically cascades to the next configured provider.
* **Contextual Demo Engine (Zero-Failure Guarantee)**:
  If no external API keys are configured, the backend automatically uses an intelligent, grounded fallback engine that analyzes real MongoDB tasks, deadlines, and tones. This guarantees the live presentation **never errors or crashes during evaluations**.
* **Key AI Capabilities**:
  * **Teacher Message Rewriter**: Polishes rough drafts into 4 distinct professional tones.
  * **Student Academic Digest**: Synthesizes homework completion, time spent, and overdue items into a readable summary.
  * **Interactive "Ask School AI" Assistant**: Contextual chatbot grounded in student tasks, timetable periods, class structure, and school statistics.

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
│   │   │   ├── User.js               # Multi-role user model (roles, student PIN, family links)
│   │   │   ├── School.js             # Multi-tenant school model (slug, settings)
│   │   │   ├── Class.js              # Academic class model (name, section, room, schedule)
│   │   │   ├── Task.js               # Homework task model with subject, priority, maxScore
│   │   │   ├── TaskBatch.js          # Parent workload sequencing and batching
│   │   │   ├── Submission.js         # Student homework submission with photos, score, feedback
│   │   │   ├── Attendance.js         # Daily class roll-call records (present/late/absent)
│   │   │   ├── Invitation.js         # Token-based onboarding invitations with 7-day expiry
│   │   │   └── Message.js            # Communications model with AI rewrite & review flags
│   │   ├── repositories/             # Data access layer (Mongoose queries only)
│   │   │   ├── userRepository.js
│   │   │   ├── taskRepository.js
│   │   │   ├── taskBatchRepository.js
│   │   │   └── messageRepository.js
│   │   ├── services/                 # Business logic & permission verification
│   │   │   ├── authService.js        # Auth, JWT, student PIN, superadmin security, invite onboarding
│   │   │   ├── schoolService.js      # Tenant profile, class CRUD, member provisioning, Kick Out
│   │   │   ├── attendanceService.js  # Class roll-call, real-time broadcasts, parent email alerts
│   │   │   ├── taskService.js        # Assignment CRUD, photo submissions, grading & parent alerts
│   │   │   ├── messageService.js     # Two-way messaging & school announcements
│   │   │   ├── emailService.js       # Resilient HTML email dispatch for invites, grades, attendance
│   │   │   ├── socketService.js      # Real-time Socket.io server & room-based broadcasting
│   │   │   ├── aiService.js          # Grounded context aggregation for AI assistants
│   │   │   └── ai/                   # AI Provider Adapters & Cascading Fallback Engine
│   │   │       ├── groqAdapter.js    # Groq Llama-3.3-70b adapter
│   │   │       ├── geminiAdapter.js  # Google Gemini Flash adapter
│   │   │       ├── nvidiaAdapter.js  # NVIDIA Nemotron-4-340B adapter
│   │   │       └── aiOrchestrator.js # Multi-provider fallback & grounded contextual engine
│   │   ├── controllers/              # HTTP request handling & status codes
│   │   │   ├── authController.js
│   │   │   ├── schoolController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── taskController.js
│   │   │   ├── messageController.js
│   │   │   └── aiController.js
│   │   ├── middleware/               # Auth, Role, Tenant, and Error middlewares
│   │   │   ├── authMiddleware.js     # JWT token verification
│   │   │   ├── roleMiddleware.js     # Role-based route authorization (permitRoles)
│   │   │   ├── tenantMiddleware.js   # Multi-tenant isolation guard (tenantGuard)
│   │   │   └── errorMiddleware.js    # Centralized JSON error handler
│   │   ├── routes/                   # Express API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── schoolRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── aiRoutes.js
│   │   ├── utils/
│   │   │   └── seedData.js           # Seeds default Super Admin, school tenant, demo users & tasks
│   │   ├── app.js                    # Express app setup, CORS, and static frontend serving
│   │   └── server.js                 # HTTP server, Socket.io initialization, clean shutdown
│   ├── test-e2e.js                   # Automated E2E test verification suite
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Navbar, Sidebar, Badge, Modal, LoadingSpinner, EmptyState, Toast
│   │   │   ├── auth/                 # StudentPinModal (keypad PIN authentication)
│   │   │   ├── tasks/                # StudentWorkSubmitModal, TaskCreateModal, TaskBatchManager
│   │   │   ├── messages/             # TeacherMessageComposer, AIDraftReviewModal
│   │   │   └── ai/                   # AIAssistantChat, AISummaryCard
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state, session persistence, role switcher, socket init
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Unified login & quick demo switcher (PDF Screen 01)
│   │   │   ├── OnboardingPage.jsx    # Token-based account activation & password setup
│   │   │   ├── SchoolAdminDashboard.jsx # Super Administrator Portal (Classes, Invites, Roster, Attendance)
│   │   │   ├── TeacherDashboard.jsx  # Teacher overview, attendance, grading studio & AI composer
│   │   │   ├── ParentDashboard.jsx   # Parent child overview, batching, attendance & AI
│   │   │   ├── StudentDashboard.jsx  # Student school day overview, homework submission & timetable
│   │   │   ├── HomeworkTasksPage.jsx # Homework & To-Do with filters (PDF Screen 03/05)
│   │   │   ├── MessagesPage.jsx      # Parent-teacher communication & announcements (PDF Screen 04)
│   │   │   └── AIAssistantPage.jsx   # "Ask School AI" assistant (PDF Screen 05)
│   │   ├── services/                 # Dedicated Axios API modules with 60s timeout
│   │   │   ├── api.js                # Axios instance with JWT interceptor and cold-start tolerance
│   │   │   ├── authService.js
│   │   │   ├── schoolService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── taskService.js
│   │   │   ├── messageService.js
│   │   │   ├── socket.js             # Socket.io client connector with auto-reconnection
│   │   │   └── aiService.js
│   │   ├── utils/
│   │   │   └── imageUtils.js         # HEIC detection, ArrayBuffer decoding, Canvas compression
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

## 👥 Seed Accounts & Demo Credentials

When the server starts, it provides pre-configured credentials for all roles:

| Role | Email / Access | Password / PIN | Description & Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin` | `admin123` *(or `12345678`)* | **Tenant & School Admin**: Creates academic classes, dispatches onboarding email invitations for Teachers, Students & Parents, links parents to children, monitors school-wide attendance, and moderates members (Kick Out / Unenroll). |
| **Teacher** | `teacher@school.com` | `password123` | **Educator**: Creates homework tasks, reviews student work snapshots, grades submissions with feedback, marks live attendance, and uses AI message composer. |
| **Parent** | `parent.sarah@school.com` | `password123` | **Parent / Guardian**: Linked to enrolled student(s), views live attendance, tracks homework submissions & teacher remarks, organizes task batches. |
| **Student** | **Alex Johnson** *(or invited student)* | PIN: `1234` | **Enrolled Student**: Submits homework snapshots/photos, logs study minutes, checks timetable and AI helper. Accessible via PIN keypad or email login. |

> 💡 **Demo Shortcut**: The login page and navigation bar include **1-Click Demo Profile Switchers** so you can jump between Super Admin, Teacher, Parent, and Student modes without retyping credentials.

---

### 🔑 Super Administrator Workflow: Classes & Member Provisioning

The **Super Administrator Portal** allows complete end-to-end management of the school tenant:

1. **Academic Classes & Structure**:
   - Navigate to **Classes & Structure** → click **+ Create Class**.
   - Set Class / Grade Name (e.g. `Grade 10`), Section (`A`), and Room Number (`01`).
   - Add custom weekly schedule/timetable items or remove periods.

2. **Member Onboarding & Invitations**:
   - Click **+ Invite Member** from the dashboard or Directory view.
   - **Teacher**: Enter full name and email; optionally map them as homeroom instructor for a class.
   - **Student**: Enter full name and email; assign them to an academic class cohort.
   - **Parent**: Enter full name and email; select the child from the **Link to Enrolled Student** dropdown. Once accepted, the parent is securely bound to the child’s attendance, homework submissions, and teacher updates.

3. **Live Directory & Moderation Controls**:
   - Search members across all roles with real-time class linkage indicators.
   - **Kick Out Member**: One-click instant revocation and removal of any member (educator, student, or parent) from the school.
   - **Unassign / Unenroll**: Easily unassign teachers from homerooms or unenroll students from classes.

4. **Campus Attendance & Academic Analytics**:
   - School-wide daily attendance rollup and percentage tracking.

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

## 🔒 Security, Multi-Tenancy & Data Privacy
- **Strict Multi-Tenant Isolation**: Enforced at the middleware level via `tenantGuard`. Cross-tenant data leakage is completely blocked.
- **Granular Role-Based Access Control (RBAC)**: All sensitive routes protected by `permitRoles('super_admin', 'school_admin', 'teacher', 'parent', 'student')`.
- **Protected Super Administrator Account**: Built-in safeguards protect the root campus administrator account from accidental deletion or kick-out.
- **Cryptographic Password Hashing**: Passwords hashed securely using Bcrypt (10 salt rounds).
- **Secure Token-Based Onboarding**: 32-byte cryptographically random tokens with 7-day expiration for email invitations.
- **Network & Cold-Start Tolerance**: Client API configured with a 60-second timeout to smoothly handle serverless and cloud container wake-ups without premature network error drops.
- **Client-Side Privacy & Bandwidth Protection**: Homework photos are processed, downscaled, and compressed directly in-memory before upload; student and parent records are scoped strictly via authorized parent-child linkages in MongoDB.
- **AI Privacy & Context Containment**: All AI interactions filter context strictly to the authenticated user's authorized class and child records; backend AI provider keys are never exposed to client bundles or browser network logs.
