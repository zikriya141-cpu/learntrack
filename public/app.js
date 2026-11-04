// LearnTrack - Frontend Logic & Quiz Operations (Day 3)

let courses = [];
let currentUser = JSON.parse(localStorage.getItem('learntrack_user')) || null;
let currentActiveQuizCourseId = null;

// DOM Elements
const courseListEl = document.getElementById('course-list');
const totalCoursesEl = document.getElementById('total-courses');
const currentRoleStat = document.getElementById('current-role-stat');
const feedbackAlert = document.getElementById('feedback-alert');

// Auth Navbar Elements
const authLoggedOut = document.getElementById('auth-logged-out');
const authLoggedIn = document.getElementById('auth-logged-in');
const navUserName = document.getElementById('nav-user-name');
const navUserRole = document.getElementById('nav-user-role');
const openAuthBtn = document.getElementById('open-auth-btn');
const logoutBtn = document.getElementById('logout-btn');

// Panels
const instructorPanel = document.getElementById('instructor-panel');
const studentPanel = document.getElementById('student-panel');
const createCourseForm = document.getElementById('create-course-form');
const addQuestionForm = document.getElementById('add-question-form');
const targetCourseSelect = document.getElementById('target-course-select');
const testUnauthorizedBtn = document.getElementById('test-unauthorized-btn');

// Studio Tabs
const tabCreateCourse = document.getElementById('tab-create-course');
const tabAddQuestion = document.getElementById('tab-add-question');

// Auth Modal Elements
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const demoInstructorBtn = document.getElementById('demo-instructor-btn');
const demoStudentBtn = document.getElementById('demo-student-btn');

// Quiz Modal Elements (Day 3 Feature)
const quizModal = document.getElementById('quiz-modal');
const closeQuizBtn = document.getElementById('close-quiz-btn');
const cancelQuizBtn = document.getElementById('cancel-quiz-btn');
const quizCourseTitle = document.getElementById('quiz-course-title');
const quizCourseBadge = document.getElementById('quiz-course-badge');
const quizQuestionsContainer = document.getElementById('quiz-questions-container');
const quizForm = document.getElementById('quiz-form');
const quizResultBox = document.getElementById('quiz-result-box');
const submitQuizBtn = document.getElementById('submit-quiz-btn');

// Detail Modal Elements
const detailModal = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalDesc = document.getElementById('modal-desc');
const modalLesson = document.getElementById('modal-lesson');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBottomClose = document.getElementById('modal-bottom-close');

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function showAlert(message, type = 'success') {
  feedbackAlert.textContent = message;
  feedbackAlert.className = 'alert ' + (type === 'error' ? 'alert-error' : 'alert-success');
  feedbackAlert.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    feedbackAlert.style.display = 'none';
  }, 5000);
}

// ==========================================
// UI SESSION & ROLE STATE
// ==========================================

function updateUIForUser() {
  if (!currentUser) {
    authLoggedOut.style.display = 'flex';
    authLoggedIn.style.display = 'none';
    instructorPanel.style.display = 'none';
    studentPanel.style.display = 'none';
    if (currentRoleStat) currentRoleStat.textContent = 'Guest';
  } else {
    authLoggedOut.style.display = 'none';
    authLoggedIn.style.display = 'flex';
    navUserName.textContent = currentUser.name;
    navUserRole.textContent = currentUser.role;
    if (currentRoleStat) currentRoleStat.textContent = currentUser.role;

    if (currentUser.role === 'instructor') {
      instructorPanel.style.display = 'block';
      studentPanel.style.display = 'none';
      populateCourseSelect();
    } else {
      instructorPanel.style.display = 'none';
      studentPanel.style.display = 'block';
    }
  }
}

function populateCourseSelect() {
  if (!targetCourseSelect) return;
  targetCourseSelect.innerHTML = courses.map(c => 
    `<option value="${c.id}">${escapeHtml(c.title)} (${c.category})</option>`
  ).join('');
}

// ==========================================
// INSTRUCTOR STUDIO TABS (Day 3 Feature)
// ==========================================

tabCreateCourse.addEventListener('click', () => {
  tabCreateCourse.classList.add('active');
  tabAddQuestion.classList.remove('active');
  createCourseForm.style.display = 'block';
  addQuestionForm.style.display = 'none';
});

tabAddQuestion.addEventListener('click', () => {
  tabAddQuestion.classList.add('active');
  tabCreateCourse.classList.remove('active');
  addQuestionForm.style.display = 'block';
  createCourseForm.style.display = 'none';
  populateCourseSelect();
});

// Handle Adding a Question
addQuestionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser || currentUser.role !== 'instructor') {
    showAlert('Access Denied: Only instructors can add questions.', 'error');
    return;
  }

  const courseId = targetCourseSelect.value;
  const payload = {
    question_text: document.getElementById('q-text').value.trim(),
    option_a: document.getElementById('opt-a').value.trim(),
    option_b: document.getElementById('opt-b').value.trim(),
    option_c: document.getElementById('opt-c').value.trim(),
    option_d: document.getElementById('opt-d').value.trim(),
    correct_option: document.getElementById('correct-opt').value,
    role: currentUser.role
  };

  try {
    const res = await fetch(`/api/courses/${courseId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add question.');

    showAlert(`Success: Question added to course successfully!`, 'success');
    addQuestionForm.reset();
    await loadCourses();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// ==========================================
// QUIZ FLOW (Day 3 Student Feature)
// ==========================================

window.openQuizModal = async function(courseId) {
  currentActiveQuizCourseId = courseId;
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  quizCourseTitle.textContent = `${course.title} — Quiz`;
  quizCourseBadge.textContent = course.category;
  quizResultBox.style.display = 'none';
  submitQuizBtn.style.display = 'inline-flex';
  quizQuestionsContainer.innerHTML = '<p style="color: var(--text-muted);">Loading quiz questions...</p>';
  quizModal.style.display = 'flex';

  try {
    const res = await fetch(`/api/courses/${courseId}/questions`);
    if (!res.ok) throw new Error('Failed to load questions.');
    const questions = await res.json();

    if (questions.length === 0) {
      quizQuestionsContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted);">
          <p>No questions have been added to this course yet.</p>
          <small>Instructors can add multiple-choice questions from the Instructor Studio.</small>
        </div>
      `;
      submitQuizBtn.style.display = 'none';
      return;
    }

    quizQuestionsContainer.innerHTML = questions.map((q, idx) => `
      <div class="quiz-question-card">
        <p class="quiz-q-prompt">Q${idx + 1}. ${escapeHtml(q.question_text)}</p>
        <div class="quiz-options-group">
          <label class="quiz-option-label">
            <input type="radio" name="question_${q.id}" value="A" required />
            <span><strong>A.</strong> ${escapeHtml(q.option_a)}</span>
          </label>
          <label class="quiz-option-label">
            <input type="radio" name="question_${q.id}" value="B" required />
            <span><strong>B.</strong> ${escapeHtml(q.option_b)}</span>
          </label>
          <label class="quiz-option-label">
            <input type="radio" name="question_${q.id}" value="C" required />
            <span><strong>C.</strong> ${escapeHtml(q.option_c)}</span>
          </label>
          <label class="quiz-option-label">
            <input type="radio" name="question_${q.id}" value="D" required />
            <span><strong>D.</strong> ${escapeHtml(q.option_d)}</span>
          </label>
        </div>
      </div>
    `).join('');

  } catch (err) {
    quizQuestionsContainer.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
};

// Handle Quiz Submission
quizForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentActiveQuizCourseId) return;

  // Gather answers
  const formData = new FormData(quizForm);
  const answers = {};

  for (let [key, val] of formData.entries()) {
    if (key.startsWith('question_')) {
      const qId = key.replace('question_', '');
      answers[qId] = val;
    }
  }

  const studentName = currentUser ? currentUser.name : 'Student Ali';

  try {
    const res = await fetch(`/api/courses/${currentActiveQuizCourseId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, student_name: studentName })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit quiz.');

    // Show Assessment Results
    const att = data.attempt;
    quizResultBox.innerHTML = `
      <div class="quiz-score-num">${att.percentage}%</div>
      <h4 style="margin: 6px 0; font-size: 18px; color: ${att.passed ? 'var(--success)' : 'var(--danger)'};">
        ${att.passed ? '🎉 Congratulations! You Passed!' : 'Needs Review - Keep Practicing!'}
      </h4>
      <p style="font-size: 14px; color: var(--text-muted);">
        You scored <strong>${att.score} out of ${att.total_questions}</strong> correct answers.
      </p>
      <small style="color: var(--text-muted); display: block; margin-top: 6px;">
        Saved to database for student: <strong>${escapeHtml(studentName)}</strong>
      </small>
    `;
    quizResultBox.style.display = 'block';
    submitQuizBtn.style.display = 'none';

    showAlert(`Quiz submitted! Result: ${att.score}/${att.total_questions} (${att.percentage}%)`, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

function closeQuiz() {
  quizModal.style.display = 'none';
  quizForm.reset();
}

closeQuizBtn.addEventListener('click', closeQuiz);
cancelQuizBtn.addEventListener('click', closeQuiz);
quizModal.addEventListener('click', (e) => {
  if (e.target === quizModal) closeQuiz();
});

// ==========================================
// AUTHENTICATION MODAL LOGIC
// ==========================================

function openAuthModal() { authModal.style.display = 'flex'; }
function closeAuthModal() { authModal.style.display = 'none'; }

openAuthBtn.addEventListener('click', openAuthModal);
closeAuthBtn.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) closeAuthModal();
});

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
});

demoInstructorBtn.addEventListener('click', () => {
  loginEmailInput.value = 'instructor@learntrack.com';
  loginPasswordInput.value = 'pass123';
  loginForm.dispatchEvent(new Event('submit'));
});

demoStudentBtn.addEventListener('click', () => {
  loginEmailInput.value = 'student@learntrack.com';
  loginPasswordInput.value = 'pass123';
  loginForm.dispatchEvent(new Event('submit'));
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in.');

    currentUser = data.user;
    localStorage.setItem('learntrack_user', JSON.stringify(currentUser));
    closeAuthModal();
    updateUIForUser();
    showAlert(`Welcome back, ${currentUser.name}! You are signed in as ${currentUser.role.toUpperCase()}.`, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register.');

    currentUser = data.user;
    localStorage.setItem('learntrack_user', JSON.stringify(currentUser));
    closeAuthModal();
    updateUIForUser();
    showAlert(`Account created successfully! Logged in as ${currentUser.role.toUpperCase()}.`, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('learntrack_user');
  updateUIForUser();
  showAlert('Signed out successfully. Viewing as Guest.', 'success');
});

// ==========================================
// INSTRUCTOR COURSE CREATION & SECURITY CHECK
// ==========================================

createCourseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser || currentUser.role !== 'instructor') {
    showAlert('Access Denied: Only instructors can publish courses.', 'error');
    return;
  }

  const payload = {
    title: document.getElementById('course-title').value.trim(),
    category: document.getElementById('course-category').value.trim() || 'General',
    description: document.getElementById('course-desc').value.trim(),
    lessons_text: document.getElementById('course-lessons').value.trim(),
    instructor_name: currentUser.name,
    role: currentUser.role
  };

  try {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create course.');

    showAlert(`Success: "${data.course.title}" has been published to catalog!`, 'success');
    createCourseForm.reset();
    await loadCourses();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

testUnauthorizedBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Test Course',
        description: 'Testing role protection',
        lessons_text: 'Should be blocked',
        role: 'student'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showAlert(`⚠️ 403 Forbidden: ${data.error}`, 'error');
    }
  } catch (err) {
    showAlert('Request blocked by security policy.', 'error');
  }
});

// ==========================================
// COURSE CATALOG & DETAILS
// ==========================================

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Failed to load courses.');
    courses = await res.json();
    renderCourses();
    populateCourseSelect();
  } catch (err) {
    courseListEl.innerHTML = `<p style="color: var(--danger);">Could not connect to database.</p>`;
  }
}

function renderCourses() {
  if (totalCoursesEl) totalCoursesEl.textContent = courses.length;

  if (courses.length === 0) {
    courseListEl.innerHTML = '<p style="color: var(--text-muted);">No courses found in database.</p>';
    return;
  }

  courseListEl.innerHTML = courses.map(c => `
    <article class="course-card">
      <div class="course-card-top">
        <span class="category-badge">${escapeHtml(c.category)}</span>
        <span class="level-badge">${c.question_count || 0} Questions</span>
      </div>
      <h4 class="course-title">${escapeHtml(c.title)}</h4>
      <p class="course-desc">${escapeHtml(c.description)}</p>
      <div class="course-meta">
        <div class="meta-item">
          <span>Instructor:</span>
          <span class="instructor-name">${escapeHtml(c.instructor_name || 'Instructor')}</span>
        </div>
      </div>
      <div class="card-btn-row">
        <button class="btn btn-outline" type="button" onclick="showCourseDetails(${c.id})">Read Lessons</button>
        <button class="btn btn-primary" type="button" onclick="openQuizModal(${c.id})">Take Quiz</button>
      </div>
    </article>
  `).join('');
}

window.showCourseDetails = function (id) {
  const c = courses.find(item => item.id === id);
  if (!c) return;
  modalTitle.textContent = c.title;
  modalCategory.textContent = c.category;
  modalDesc.textContent = c.description;
  modalLesson.textContent = c.lessons_text;
  detailModal.style.display = 'flex';
};

function closeDetailModal() { detailModal.style.display = 'none'; }
modalCloseBtn.addEventListener('click', closeDetailModal);
modalBottomClose.addEventListener('click', closeDetailModal);
detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetailModal();
});

// Initialize on Load
updateUIForUser();
loadCourses();