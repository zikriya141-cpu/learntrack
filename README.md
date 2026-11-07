# LearnTrack - Student Learning & Quiz Management System

LearnTrack is a production-grade full-stack learning platform built for small learning centers during Week 2 of the Stack & Scale Remote Internship (November 2026). It enables instructors to author modular courses with lesson content and multiple-choice quizzes, while allowing students to study lessons, attempt assessments, and receive instant, tamper-proof server-side evaluations.

---

## 1. Project Purpose & Features
- Dual Role-Based System (RBAC): Distinct workflows for Instructors and Students with password encryption via bcryptjs.
- Instructor Studio: Authorized course creation and multiple-choice question authoring with 4 distinct choices and verified answer keys.
- Student Learning & Assessment: Responsive catalog browsing, rich lesson viewing, and interactive quiz taking.
- Server-Side Scoring: Answers are evaluated strictly on the backend against database keys; client-side score tampering is impossible.
- Student Attempt History: Every quiz attempt is stored with score, total questions, percentage, and timestamps.
- Relational Persistence: SQLite database enforces foreign key integrity across Users, Courses, Questions, and Attempts.
- Security & Authorization: Role-protected API endpoints returning 403 Forbidden for unauthorized student requests.

---

## 2. Tech Stack
- Frontend: Vanilla JavaScript (ES6+), HTML5, Modern CSS (Responsive Grid, Ambient Glow, Glassmorphism).
- Backend: Node.js, Express.js.
- Database: SQLite (node:sqlite).
- Security: bcryptjs password hashing, RBAC middleware.
- Version Control: Git & GitHub.

---

## 3. Setup & Running Locally

### Prerequisites
- Node.js installed (v18 or higher recommended).

### Installation & Run
1. Clone the repository:
   git clone https://github.com/zikriya141-cpu/learntrack.git
   cd learntrack
2. Install dependencies:
   npm install
3. Start the application:
   node server.js
4. Open your browser and navigate to:
   http://localhost:3000

---

## 4. Pre-Seeded Demo Accounts

- Instructor Account:
  Email: instructor@learntrack.com
  Password: pass123
  Permissions: Create courses, author quiz questions, view catalog

- Student Account:
  Email: student@learntrack.com
  Password: pass123
  Permissions: Browse courses, read lessons, attempt quizzes, view scores

---

## 5. REST API Endpoints

- POST /api/auth/register : Register new user account (Public)
- POST /api/auth/login : Authenticate user & return session info (Public)
- GET /api/courses : List all available courses with question counts (Public)
- POST /api/courses : Create and publish a new course (Instructor Only - 403 for Students)
- GET /api/courses/:id/questions : Get quiz questions for a course (Students & Instructors)
- POST /api/courses/:id/questions : Add a multiple-choice question to a course (Instructor Only)
- POST /api/courses/:id/submit : Submit quiz choices & evaluate score server-side (Students)
- GET /api/attempts : Fetch all historical quiz submissions (Authenticated Users)

---

## 6. Known Limitations
- Session state is currently managed locally per device via client storage.
- Payment integration, video streaming, and certificates are out of scope for Week 2 foundation.

---

## 7. AI Assistance Disclosure
As permitted by the Stack & Scale responsible AI policy, Google Gemini was utilized as an interactive learning collaborator for architecture reviews, debugging SQLite foreign-key setup, drafting test suites, and structuring documentation. All application code was reviewed, executed, and understood by the intern.