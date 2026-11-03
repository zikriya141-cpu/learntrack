// LearnTrack - Frontend Logic & Authentication (Day 2)

let courses = [];
let currentUser = JSON.parse(localStorage.getItem('learntrack_user')) || null;

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
const testUnauthorizedBtn = document.getElementById('test-unauthorized-btn');

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
    // Logged Out (Guest Mode)
    authLoggedOut.style.display = 'flex';
    authLoggedIn.style.display = 'none';
    instructorPanel.style.display = 'none';
    studentPanel.style.display = 'none';
    if (currentRoleStat) currentRoleStat.textContent = 'Guest';
  } else {
    // Logged In Mode
    authLoggedOut.style.display = 'none';
    authLoggedIn.style.display = 'flex';
    navUserName.textContent = currentUser.name;
    navUserRole.textContent = currentUser.role;
    if (currentRoleStat) currentRoleStat.textContent = currentUser.role;

    if (currentUser.role === 'instructor') {
      instructorPanel.style.display = 'block';
      studentPanel.style.display = 'none';
    } else {
      instructorPanel.style.display = 'none';
      studentPanel.style.display = 'block';
    }
  }
}

// ==========================================
// AUTHENTICATION MODAL LOGIC
// ==========================================

function openAuthModal() {
  authModal.style.display = 'flex';
}

function closeAuthModal() {
  authModal.style.display = 'none';
}

openAuthBtn.addEventListener('click', openAuthModal);
closeAuthBtn.addEventListener('click', closeAuthModal);
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) closeAuthModal();
});

// Switch Tabs
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

// Quick 1-Click Demo Buttons
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

// Login Form Submit
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

// Register Form Submit
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

// Logout
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('learntrack_user');
  updateUIForUser();
  showAlert('Signed out successfully. You are now viewing as Guest.', 'success');
});

// ==========================================
// INSTRUCTOR COURSE CREATION & SECURITY CHECK
// ==========================================

// Handle Course Creation
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

    showAlert(`Success: "${data.course.title}" has been published to the catalog!`, 'success');
    createCourseForm.reset();
    await loadCourses();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// Test Unauthorized Action (Student trying to trigger instructor API)
testUnauthorizedBtn.addEventListener('click', async () => {
  try {
    // Attempting instructor course creation using student role
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
      // Demonstrates 403 Forbidden Error Evidence
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
        <span class="level-badge">Verified DB</span>
      </div>
      <h4 class="course-title">${escapeHtml(c.title)}</h4>
      <p class="course-desc">${escapeHtml(c.description)}</p>
      <div class="course-meta">
        <div class="meta-item">
          <span>Instructor:</span>
          <span class="instructor-name">${escapeHtml(c.instructor_name || 'Instructor')}</span>
        </div>
      </div>
      <button class="btn btn-primary" type="button" onclick="showCourseDetails(${c.id})">View Lessons & Overview</button>
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

function closeDetailModal() {
  detailModal.style.display = 'none';
}

modalCloseBtn.addEventListener('click', closeDetailModal);
modalBottomClose.addEventListener('click', closeDetailModal);
detailModal.addEventListener('click', (e) => {
  if (e.target === detailModal) closeDetailModal();
});

// Initialize on Load
updateUIForUser();
loadCourses();