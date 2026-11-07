const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect SQLite Database
const dbPath = path.join(__dirname, 'learntrack.db');
const db = new DatabaseSync(dbPath);
console.log('Connected to SQLite database (learntrack.db).');

// Initialize Schema
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('instructor', 'student')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    lessons_text TEXT NOT NULL,
    instructor_name TEXT DEFAULT 'Instructor',
    instructor_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    course_id INTEGER,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Users
const userCount = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `);
  const hashedPass = bcrypt.hashSync('pass123', 10);
  insertUser.run('Prof. Farooq', 'instructor@learntrack.com', hashedPass, 'instructor');
  insertUser.run('Ali Ahmed', 'student@learntrack.com', hashedPass, 'student');
}

// Seed Courses
const courseCount = db.prepare('SELECT COUNT(*) AS total FROM courses').get().total;
if (courseCount === 0) {
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, description, category, lessons_text, instructor_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCourse.run(
    'Full-Stack Foundations: Client, API & Database',
    'Understand how frontend clients communicate with backend Express servers and persist data in relational SQLite tables.',
    'Web Architecture',
    'Lesson 1: The Request-Response Lifecycle\nClients send HTTP requests carrying JSON payloads to Express routers.',
    'Prof. Farooq'
  );

  insertCourse.run(
    'Relational Entity Modeling & Foreign Keys',
    'Learn how to connect Users, Courses, Questions, and Quiz Attempts using clean foreign key relationships and schema integrity.',
    'Databases',
    'Lesson 1: Database Normalization\nForeign keys link child records to parent records.',
    'Dr. Sara'
  );
}

// Seed Questions if empty
const questionCount = db.prepare('SELECT COUNT(*) AS total FROM questions').get().total;
if (questionCount === 0) {
  const allCourses = db.prepare('SELECT id FROM courses ORDER BY id ASC').all();
  if (allCourses.length > 0) {
    const insertQuestion = db.prepare(`
      INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertQuestion.run(allCourses[0].id, 'Which HTTP method is typically used to create a new resource on the server?', 'GET', 'POST', 'DELETE', 'HEAD', 'B');
    insertQuestion.run(allCourses[0].id, 'What is the primary role of SQLite in this full-stack application?', 'Styling UI components', 'Handling DNS routing', 'Providing persistent relational data storage', 'Compiling frontend JavaScript', 'C');
    insertQuestion.run(allCourses[0].id, 'Which status code signifies an unauthorized action where access is forbidden?', '200 OK', '201 Created', '403 Forbidden', '404 Not Found', 'C');
  }
}

// Seed Sample History Attempt (Ensures history table is never empty)
const attemptCount = db.prepare('SELECT COUNT(*) AS total FROM attempts').get().total;
if (attemptCount === 0) {
  const allCourses = db.prepare('SELECT id FROM courses ORDER BY id ASC').all();
  const cId = allCourses.length > 0 ? allCourses[0].id : 1;
  const insertAttempt = db.prepare(`
    INSERT INTO attempts (student_name, course_id, score, total_questions, percentage)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAttempt.run('Ali Ahmed', cId, 3, 3, 100);
  insertAttempt.run('Ali Ahmed', cId, 2, 3, 67);
  console.log('Sample quiz history attempts seeded successfully.');
}

// ==========================================
// API ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name.trim(), email.toLowerCase().trim(), hashedPassword, role);
    res.status(201).json({ message: 'Success', user: { id: Number(result.lastInsertRowid), name, email, role } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ message: 'Success', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
    const coursesWithMeta = courses.map(c => {
      const qCount = db.prepare('SELECT COUNT(*) as total FROM questions WHERE course_id = ?').get(c.id).total;
      return { ...c, question_count: qCount };
    });
    res.json(coursesWithMeta);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/courses', (req, res) => {
  try {
    const { title, description, category, lessons_text, instructor_name, role } = req.body;
    if (!role || role !== 'instructor') return res.status(403).json({ error: 'Access Denied: Only instructors can create courses.' });
    const stmt = db.prepare('INSERT INTO courses (title, description, category, lessons_text, instructor_name) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(title.trim(), description.trim(), category || 'General', lessons_text.trim(), instructor_name || 'Instructor');
    res.status(201).json({ message: 'Success', course: { id: Number(result.lastInsertRowid), title } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/courses/:id/questions', (req, res) => {
  try {
    const questions = db.prepare('SELECT id, course_id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE course_id = ?').all(Number(req.params.id));
    res.json(questions);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/courses/:id/questions', (req, res) => {
  try {
    const { question_text, option_a, option_b, option_c, option_d, correct_option, role } = req.body;
    if (!role || role !== 'instructor') return res.status(403).json({ error: 'Access Denied' });
    const stmt = db.prepare('INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(Number(req.params.id), question_text.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), correct_option.toUpperCase().trim());
    res.status(201).json({ message: 'Question saved' });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/courses/:id/submit', (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { answers, student_name } = req.body;
    const officialQuestions = db.prepare('SELECT id, correct_option FROM questions WHERE course_id = ?').all(courseId);
    let correctCount = 0;
    officialQuestions.forEach(q => {
      if (answers && answers[q.id] && answers[q.id].toUpperCase() === q.correct_option.toUpperCase()) correctCount++;
    });
    const total = officialQuestions.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const insertAttempt = db.prepare('INSERT INTO attempts (student_name, course_id, score, total_questions, percentage) VALUES (?, ?, ?, ?, ?)');
    const r = insertAttempt.run(student_name || 'Ali Ahmed', courseId, correctCount, total, percentage);
    res.json({ message: 'Success', attempt: { id: Number(r.lastInsertRowid), score: correctCount, total_questions: total, percentage, passed: percentage >= 50 } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// GET /api/attempts - Reliable History Route
app.get('/api/attempts', (req, res) => {
  try {
    const attempts = db.prepare(`
      SELECT a.id, a.student_name, a.score, a.total_questions, a.percentage, a.created_at,
             COALESCE(c.title, 'Full-Stack Foundations') as course_title
      FROM attempts a
      LEFT JOIN courses c ON a.course_id = c.id
      ORDER BY a.id DESC
    `).all();
    res.json(attempts);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.listen(PORT, () => {
  console.log(`LearnTrack is running at http://localhost:${PORT}`);
});