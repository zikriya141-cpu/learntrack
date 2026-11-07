let courses = [];
let currentUser = JSON.parse(localStorage.getItem('learntrack_user')) || null;
let currentActiveQuizCourseId = null;

const courseListEl = document.getElementById('course-list');
const totalCoursesEl = document.getElementById('total-courses');
const currentRoleStat = document.getElementById('current-role-stat');
const feedbackAlert = document.getElementById('feedback-alert');

const authLoggedOut = document.getElementById('auth-logged-out');
const authLoggedIn = document.getElementById('auth-logged-in');
const navUserName = document.getElementById('nav-user-name');
const navUserRole = document.getElementById('nav-user-role');
const openAuthBtn = document.getElementById('open-auth-btn');
const logoutBtn = document.getElementById('logout-btn');

const instructorPanel = document.getElementById('instructor-panel');
const studentPanel = document.getElementById('student-panel');
const createCourseForm = document.getElementById('create-course-form');
const addQuestionForm = document.getElementById('add-question-form');
const targetCourseSelect = document.getElementById('target-course-select');
const testUnauthorizedBtn = document.getElementById('test-unauthorized-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const attemptsHistorySection = document.getElementById('attempts-history-section');
const attemptsTableContainer = document.getElementById('attempts-table-container');

const tabCreateCourse = document.getElementById('tab-create-course');
const tabAddQuestion = document.getElementById('tab-add-question');

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

const quizModal = document.getElementById('quiz-modal');
const closeQuizBtn = document.getElementById('close-quiz-btn');
const cancelQuizBtn = document.getElementById('cancel-quiz-btn');
const quizCourseTitle = document.getElementById('quiz-course-title');
const quizCourseBadge = document.getElementById('quiz-course-badge');
const quizQuestionsContainer = document.getElementById('quiz-questions-container');
const quizForm = document.getElementById('quiz-form');
const quizResultBox = document.getElementById('quiz-result-box');
const submitQuizBtn = document.getElementById('submit-quiz-btn');

const detailModal = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalDesc = document.getElementById('modal-desc');
const modalLesson = document.getElementById('modal-lesson');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBottomClose = document.getElementById('modal-bottom-close');

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
  setTimeout(() => { feedbackAlert.style.display = 'none'; }, 4000);
}

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

if (tabCreateCourse) {
  tabCreateCourse.addEventListener('click', () => {
    tabCreateCourse.classList.add('active');
    tabAddQuestion.classList.remove('active');
    createCourseForm.style.display = 'block';
    addQuestionForm.style.display = 'none';
  });
}

if (tabAddQuestion) {
  tabAddQuestion.addEventListener('click', () => {
    tabAddQuestion.classList.add('active');
    tabCreateCourse.classList.remove('active');
    addQuestionForm.style.display = 'block';
    createCourseForm.style.display = 'none';
    populateCourseSelect();
  });
}

if (addQuestionForm) {
  addQuestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = targetCourseSelect.value;
    const payload = {
      question_text: document.getElementById('q-text').value.trim(),
      option_a: document.getElementById('opt-a').value.trim(),
      option_b: document.getElementById('opt-b').value.trim(),
      option_c: document.getElementById('opt-c').value.trim(),
      option_d: document.getElementById('opt-d').value.trim(),
      correct_option: document.getElementById('correct-opt').value,
      role: currentUser ? currentUser.role : 'instructor'
    };

    try {
      const res = await fetch(`/api/courses/${courseId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add question');
      showAlert('Question added to course successfully!', 'success');
      addQuestionForm.reset();
      await loadCourses();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });
}

// Student History (Day 4 & 5 Feature)
if (viewHistoryBtn) {
  viewHistoryBtn.addEventListener('click', async () => {
    if (attemptsHistorySection.style.display === 'block') {
      attemptsHistorySection.style.display = 'none';
      return;
    }

    try {
      const res = await fetch('/api/attempts');
      const attempts = await res.json();

      if (attempts.length === 0) {
        attemptsTableContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13.5px;">No quiz attempts logged yet. Complete a quiz below!</p>';
      } else {
        attemptsTableContainer.innerHTML = `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border); color: var(--text-muted);">
                  <th style="padding: 8px 10px;">Student</th>
                  <th style="padding: 8px 10px;">Course</th>
                  <th style="padding: 8px 10px;">Score</th>
                  <th style="padding: 8px 10px;">Percentage</th>
                  <th style="padding: 8px 10px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${attempts.map(a => `
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px;">${escapeHtml(a.student_name)}</td>
                    <td style="padding: 10px; font-weight: 600;">${escapeHtml(a.course_title)}</td>
                    <td style="padding: 10px;">${a.score} / ${a.total_questions}</td>
                    <td style="padding: 10px;"><strong>${a.percentage}%</strong></td>
                    <td style="padding: 10px;"><span class="level-badge" style="background: ${a.percentage >= 50 ? 'var(--success-light)' : 'var(--danger-light)'}; color: ${a.percentage >= 50 ? '#065f46' : '#991b1b'}">${a.percentage >= 50 ? 'Passed' : 'Review'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      attemptsHistorySection.style.display = 'block';
    } catch (e) {
      showAlert('Could not load attempts history.', 'error');
    }
  });
}

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
    const questions = await res.json();

    if (questions.length === 0) {
      quizQuestionsContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-muted);">No questions available yet for this course.</p>';
      submitQuizBtn.style.display = 'none';
      return;
    }

    quizQuestionsContainer.innerHTML = questions.map((q, idx) => `
      <div class="quiz-question-card">
        <p class="quiz-q-prompt">Q${idx + 1}. ${escapeHtml(q.question_text)}</p>
        <div class="quiz-options-group">
          <label class="quiz-option-label"><input type="radio" name="question_${q.id}" value="A" required /> <span><strong>A.</strong> ${escapeHtml(q.option_a)}</span></label>
          <label class="quiz-option-label"><input type="radio" name="question_${q.id}" value="B" required /> <span><strong>B.</strong> ${escapeHtml(q.option_b)}</span></label>
          <label class="quiz-option-label"><input type="radio" name="question_${q.id}" value="C" required /> <span><strong>C.</strong> ${escapeHtml(q.option_c)}</span></label>
          <label class="quiz-option-label"><input type="radio" name="question_${q.id}" value="D" required /> <span><strong>D.</strong> ${escapeHtml(q.option_d)}</span></label>
        </div>
      </div>
    `).join('');
  } catch (err) {
    quizQuestionsContainer.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
};

quizForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(quizForm);
  const answers = {};
  for (let [k, v] of formData.entries()) {
    if (k.startsWith('question_')) answers[k.replace('question_', '')] = v;
  }

  const studentName = currentUser ? currentUser.name : 'Ali Ahmed';

  try {
    const res = await fetch(`/api/courses/${currentActiveQuizCourseId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, student_name: studentName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to evaluate quiz');

    const att = data.attempt;
    quizResultBox.innerHTML = `
      <div class="quiz-score-num">${att.percentage}%</div>
      <h4 style="margin: 6px 0; font-size: 18px; color: ${att.passed ? 'var(--success)' : 'var(--danger)'};">
        ${att.passed ? '🎉 Congratulations! You Passed!' : 'Needs Review - Keep Practicing!'}
      </h4>
      <p style="font-size: 14px; color: var(--text-muted);">
        You scored <strong>${att.score} out of ${att.total_questions}</strong> correct answers.
      </p>
    `;
    quizResultBox.style.display = 'block';
    submitQuizBtn.style.display = 'none';
    showAlert(`Quiz evaluated! Score: ${att.score}/${att.total_questions}`, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

function closeQuiz() { quizModal.style.display = 'none'; quizForm.reset(); }
closeQuizBtn.addEventListener('click', closeQuiz);
cancelQuizBtn.addEventListener('click', closeQuiz);

// Auth logic
openAuthBtn.addEventListener('click', () => { authModal.style.display = 'flex'; });
closeAuthBtn.addEventListener('click', () => { authModal.style.display = 'none'; });

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
    if (!res.ok) throw new Error(data.error || 'Login failed');
    currentUser = data.user;
    localStorage.setItem('learntrack_user', JSON.stringify(currentUser));
    authModal.style.display = 'none';
    updateUIForUser();
    showAlert(`Welcome back, ${currentUser.name}!`, 'success');
  } catch (err) { showAlert(err.message, 'error'); }
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
    if (!res.ok) throw new Error(data.error || 'Register failed');
    currentUser = data.user;
    localStorage.setItem('learntrack_user', JSON.stringify(currentUser));
    authModal.style.display = 'none';
    updateUIForUser();
    showAlert('Account created successfully!', 'success');
  } catch (err) { showAlert(err.message, 'error'); }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('learntrack_user');
  updateUIForUser();
  showAlert('Signed out successfully.', 'success');
});

createCourseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('course-title').value.trim(),
    category: document.getElementById('course-category').value.trim() || 'General',
    description: document.getElementById('course-desc').value.trim(),
    lessons_text: document.getElementById('course-lessons').value.trim(),
    instructor_name: currentUser ? currentUser.name : 'Instructor',
    role: currentUser ? currentUser.role : 'instructor'
  };
  try {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create course');
    showAlert('Course published successfully!', 'success');
    createCourseForm.reset();
    await loadCourses();
  } catch (err) { showAlert(err.message, 'error'); }
});

if (testUnauthorizedBtn) {
  testUnauthorizedBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', description: 'Test', lessons_text: 'Test', role: 'student' })
      });
      const data = await res.json();
      if (!res.ok) showAlert(`⚠️ 403 Forbidden: ${data.error}`, 'error');
    } catch (err) { showAlert('Blocked by security policy.', 'error'); }
  });
}

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    courses = await res.json();
    renderCourses();
    populateCourseSelect();
  } catch (err) { courseListEl.innerHTML = '<p style="color: var(--danger);">Failed to load courses.</p>'; }
}

function renderCourses() {
  if (totalCoursesEl) totalCoursesEl.textContent = courses.length;
  courseListEl.innerHTML = courses.map(c => `
    <article class="course-card">
      <div class="course-card-top">
        <span class="category-badge">${escapeHtml(c.category)}</span>
        <span class="level-badge">${c.question_count || 0} Questions</span>
      </div>
      <h4 class="course-title">${escapeHtml(c.title)}</h4>
      <p class="course-desc">${escapeHtml(c.description)}</p>
      <div class="course-meta">
        <div class="meta-item"><span>Instructor:</span> <span class="instructor-name">${escapeHtml(c.instructor_name || 'Instructor')}</span></div>
      </div>
      <div class="card-btn-row">
        <button class="btn btn-outline" type="button" onclick="showCourseDetails(${c.id})">Read Lessons</button>
        <button class="btn btn-primary" type="button" onclick="openQuizModal(${c.id})">Take Quiz</button>
      </div>
    </article>
  `).join('');
}

window.showCourseDetails = function(id) {
  const c = courses.find(i => i.id === id);
  if (!c) return;
  modalTitle.textContent = c.title;
  modalCategory.textContent = c.category;
  modalDesc.textContent = c.description;
  modalLesson.textContent = c.lessons_text;
  detailModal.style.display = 'flex';
};

modalCloseBtn.addEventListener('click', () => { detailModal.style.display = 'none'; });
modalBottomClose.addEventListener('click', () => { detailModal.style.display = 'none'; });

updateUIForUser();
loadCourses();