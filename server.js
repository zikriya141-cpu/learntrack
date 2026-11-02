const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect SQLite Database
const dbPath = path.join(__dirname, 'learntrack.db');
const db = new DatabaseSync(dbPath);
console.log('Connected to SQLite database (learntrack.db).');

// Initialize Schema with Foreign Keys
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
    instructor_name TEXT DEFAULT 'Prof. Farooq',
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
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Course if database is empty
const count = db.prepare('SELECT COUNT(*) AS total FROM courses').get().total;
if (count === 0) {
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, description, category, lessons_text, instructor_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCourse.run(
    'Full-Stack Foundations: Client, API & Database',
    'Understand how frontend clients communicate with backend Express servers and persist data in relational SQLite tables.',
    'Web Architecture',
    'Lesson 1: The Request-Response Lifecycle\nWhen a client submits data, it packages payload in JSON via HTTP POST. The Express router validates parameters before storing them in SQLite.',
    'Prof. Farooq'
  );

  insertCourse.run(
    'Relational Entity Modeling & Foreign Keys',
    'Learn how to connect Users, Courses, Questions, and Quiz Attempts using clean foreign key relationships and schema integrity.',
    'Databases',
    'Lesson 1: One-to-Many Relationships\nAn Instructor creates multiple Courses (Course.instructor_id -> User.id). Each Course contains multiple Questions.',
    'Dr. Sara'
  );

  console.log('Sample courses seeded successfully into SQLite.');
}

// REST API: GET /api/courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

app.listen(PORT, () => {
  console.log(`LearnTrack is running at http://localhost:${PORT}`);
});