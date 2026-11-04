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

// 1. Seed Initial Users if empty
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

// 2. Seed Initial Courses if empty
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
    'Lesson 1: The Request-Response Lifecycle\nClients send HTTP requests (GET, POST, PUT, DELETE) carrying JSON payloads. The Express backend routes these requests, applies business logic, validates inputs, and interacts with SQLite for persistent storage.',
    'Prof. Farooq'
  );

  insertCourse.run(
    'Relational Entity Modeling & Foreign Keys',
    'Learn how to connect Users, Courses, Questions, and Quiz Attempts using clean foreign key relationships and schema integrity.',
    'Databases',
    'Lesson 1: Database Normalization & Foreign Keys\nIn a relational database, entities are separated into dedicated tables. A foreign key in the child table references the primary key of the parent table, ensuring referential integrity.',
    'Dr. Sara'
  );
  console.log('Sample courses seeded successfully.');
}

// 3. Seed Sample Quiz Questions (Checks questions table directly)
const questionCount = db.prepare('SELECT COUNT(*) AS total FROM questions').get().total;
if (questionCount === 0) {
  const allCourses = db.prepare('SELECT id FROM courses ORDER BY id ASC').all();
  if (allCourses.length > 0) {
    const insertQuestion = db.prepare(`
      INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Add 3 questions to the first course
    insertQuestion.run(
      allCourses[0].id,
      'Which HTTP method is typically used to create a new resource on the server?',
      'GET',
      'POST',
      'DELETE',
      'HEAD',
      'B'
    );

    insertQuestion.run(
      allCourses[0].id,
      'What is the primary role of SQLite in this full-stack application?',
      'Styling UI components',
      'Handling DNS routing',
      'Providing persistent relational data storage',
      'Compiling frontend JavaScript',
      'C'
    );

    insertQuestion.run(
      allCourses[0].id,
      'Which status code signifies an unauthorized action where access is forbidden?',
      '200 OK',
      '201 Created',
      '403 Forbidden',
      '404 Not Found',
      'C'
    );

    // If second course exists, add questions to it as well
    if (allCourses.length > 1) {
      insertQuestion.run(
        allCourses[1].id,
        'What does a Foreign Key establish between two relational tables?',
        'A link connecting child records to a parent record',
        'An encrypted password backup',
        'A temporary browser session cookie',
        'A frontend CSS media query',
        'A'
      );
    }

    console.log('Sample quiz questions seeded for existing courses successfully!');
  }
}

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (role !== 'instructor' && role !== 'student') {
      return res.status(400).json({ error: 'Role must be instructor or student.' });
    }

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
      user: { id: Number(result.lastInsertRowid), name: name.trim(), email: email.toLowerCase().trim(), role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ==========================================
// COURSE MANAGEMENT ROUTES
// ==========================================

app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
    const coursesWithMeta = courses.map(c => {
      const qCount = db.prepare('SELECT COUNT(*) as total FROM questions WHERE course_id = ?').get(c.id).total;
      return { ...c, question_count: qCount };
    });
    res.json(coursesWithMeta);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

app.post('/api/courses', (req, res) => {
  try {
    const { title, description, category, lessons_text, instructor_name, role } = req.body;

    if (!role || role !== 'instructor') {
      return res.status(403).json({ error: 'Access Denied: Only instructors can create courses.' });
    }
    if (!title || !description || !lessons_text) {
      return res.status(400).json({ error: 'Title, description, and lesson content are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO courses (title, description, category, lessons_text, instructor_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title.trim(), description.trim(), category ? category.trim() : 'General', lessons_text.trim(), instructor_name || 'Instructor');

    res.status(201).json({
      message: 'Course published successfully!',
      course: { id: Number(result.lastInsertRowid), title: title.trim(), category: category || 'General' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save course.' });
  }
});

// ==========================================
// QUIZ & QUESTION ROUTES (Day 3 Feature)
// ==========================================

// 1. GET /api/courses/:id/questions - Fetch quiz questions for students
app.get('/api/courses/:id/questions', (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const questions = db.prepare(`
      SELECT id, course_id, question_text, option_a, option_b, option_c, option_d 
      FROM questions 
      WHERE course_id = ?
    `).all(courseId);

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz questions.' });
  }
});

// 2. POST /api/courses/:id/questions - Instructor adds a question
app.post('/api/courses/:id/questions', (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { question_text, option_a, option_b, option_c, option_d, correct_option, role } = req.body;

    if (!role || role !== 'instructor') {
      return res.status(403).json({ error: 'Access Denied: Only instructors can add questions.' });
    }

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: 'Question prompt, all 4 options, and correct option are required.' });
    }

    const validOption = correct_option.toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(validOption)) {
      return res.status(400).json({ error: 'Correct option must be A, B, C, or D.' });
    }

    const stmt = db.prepare(`
      INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(courseId, question_text.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), validOption);

    res.status(201).json({
      message: 'Question added successfully!',
      question: { id: Number(result.lastInsertRowid), course_id: courseId, question_text }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save question.' });
  }
});

// 3. POST /api/courses/:id/submit - Student submits quiz
app.post('/api/courses/:id/submit', (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { answers, student_name } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: 'Please answer the quiz questions before submitting.' });
    }

    const officialQuestions = db.prepare('SELECT id, correct_option FROM questions WHERE course_id = ?').all(courseId);

    if (officialQuestions.length === 0) {
      return res.status(400).json({ error: 'This course does not have any questions yet.' });
    }

    let correctCount = 0;
    officialQuestions.forEach(q => {
      const studentChoice = answers[q.id];
      if (studentChoice && studentChoice.toUpperCase() === q.correct_option.toUpperCase()) {
        correctCount++;
      }
    });

    const totalQuestions = officialQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const insertAttempt = db.prepare(`
      INSERT INTO attempts (student_name, course_id, score, total_questions, percentage)
      VALUES (?, ?, ?, ?, ?)
    `);
    const attemptResult = insertAttempt.run(student_name || 'Student', courseId, correctCount, totalQuestions, percentage);

    res.json({
      message: 'Quiz submitted and evaluated successfully!',
      attempt: {
        id: Number(attemptResult.lastInsertRowid),
        score: correctCount,
        total_questions: totalQuestions,
        percentage: percentage,
        passed: percentage >= 50
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process quiz submission.' });
  }
});

app.listen(PORT, () => {
  console.log(`LearnTrack is running at http://localhost:${PORT}`);
});