# LearnTrack - Day 4: Testing & Verification Checklist

## Test Execution Summary
- **Tester:** Intern
- **Date:** 2026-11-05
- **Project:** LearnTrack (Student Learning & Quiz Management System)
- **Status:** All Core Test Cases Passed (PASS)

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Test ID | Feature | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | User Registration | Register as new student and new instructor | User record created with hashed password (`bcryptjs`) | User registered and stored in `users` table | **PASS** |
| **TC-02** | User Login | Sign in with valid credentials | Session active; user badge and role displayed | Logged in successfully; role pill rendered | **PASS** |
| **TC-03** | Invalid Login | Sign in with incorrect password | Blocked with 401 Unauthorized | "Invalid email or password" error banner shown | **PASS** |
| **TC-04** | Role Restriction | Student attempts to create a course (`POST /api/courses`) | Blocked with 403 Forbidden | "Access Denied: Only instructors are authorized" | **PASS** |
| **TC-05** | Question Authoring | Student attempts to add quiz question | Blocked with 403 Forbidden | Access denied; only instructors can add questions | **PASS** |

---

## 2. Course & Quiz Operations

| Test ID | Feature | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-06** | Course Creation | Instructor publishes course with title, description, and lessons | Course saved to database and rendered in catalog | Course added to SQLite; dynamic catalog refreshed | **PASS** |
| **TC-07** | Course Validation | Submit course creation form with blank title or description | Blocked with 400 Bad Request | Required field validation triggered; submission blocked | **PASS** |
| **TC-08** | Question Authoring | Instructor adds 4-option MCQ with answer key | Question saved to `questions` table linked by `course_id` | Question persisted with correct foreign key | **PASS** |
| **TC-09** | Question Validation | Submit question with missing options or invalid key | Blocked with 400 Bad Request | Prompted for valid options A, B, C, or D | **PASS** |

---

## 3. Server-Side Scoring, Persistence & Edge Cases

| Test ID | Feature | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-10** | Perfect Quiz Attempt | Submit all correct answers (B, C, C) | Server evaluates score: 3/3 (100%), Passed | 100% score calculated and saved to `attempts` table | **PASS** |
| **TC-11** | Wrong Answers Test | Submit incorrect options | Server evaluates score accurately without client trust | Score calculated strictly against DB answer keys | **PASS** |
| **TC-12** | Empty Quiz Check | Open quiz on course without questions | Clean empty state message displayed | "No questions have been added yet" banner shown | **PASS** |
| **TC-13** | Database Persistence | Restart Node server (`node server.js`) and reload browser | All users, courses, questions, and attempts intact | 100% data restored from `learntrack.db` | **PASS** |
| **TC-14** | Repeat Attempts | Student takes quiz multiple times | Each attempt logged with timestamp and score | Multiple records stored in `attempts` table | **PASS** |