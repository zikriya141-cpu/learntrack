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

// Initialize Schema with Foreign Keys & Role Constraints
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
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Users & Courses if empty
const userCount = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `);

  const hashedPass = bcrypt.hashSync('pass123', 10);
  insertUser.run('Prof. Farooq', 'instructor@learntrack.com', hashedPass, 'instructor');
  insertUser.run('Ali Ahmed', 'student@learntrack.com', hashedPass, 'student');
  console.log('Sample Instructor and Student accounts seeded.');
}

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
  console.log('Sample courses seeded successfully.');
}

// ==========================================
// AUTHENTICATION API ROUTES (Day 2)
// ==========================================

// 1. REGISTER: POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (Name, Email, Password, Role) are required.' });
    }

    if (role !== 'instructor' && role !== 'student') {
      return res.status(400).json({ error: 'Role must be either instructor or student.' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), email.toLowerCase().trim(), hashedPassword, role);

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: Number(result.lastInsertRowid),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 2. LOGIN: POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ==========================================
// COURSE MANAGEMENT & ACCESS CONTROL (Day 2)
// ==========================================

// 3. GET /api/courses - Public course catalog
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY id DESC').all();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// 4. POST /api/courses - Instructor-Only Course Creation with Authorization
app.post('/api/courses', (req, res) => {
  try {
    const { title, description, category, lessons_text, instructor_name, role } = req.body;

    // SECURITY CHECK: Ensure students cannot access instructor actions
    if (!role || role !== 'instructor') {
      return res.status(403).json({
        error: 'Access Denied: Only instructors are authorized to create courses.'
      });
    }

    // Input Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Course title is required.' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Course description is required.' });
    }
    if (!lessons_text || lessons_text.trim() === '') {
      return res.status(400).json({ error: 'Lesson material content is required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO courses (title, description, category, lessons_text, instructor_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      description.trim(),
      category ? category.trim() : 'General',
      lessons_text.trim(),
      instructor_name || 'Instructor'
    );

    res.status(201).json({
      message: 'Course published successfully!',
      course: {
        id: Number(result.lastInsertRowid),
        title: title.trim(),
        description: description.trim(),
        category: category || 'General',
        instructor_name: instructor_name || 'Instructor'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save course to database.' });
  }
});

app.listen(PORT, () => {
  console.log(`LearnTrack is running at http://localhost:${PORT}`);
});