let courses = [];

const courseListEl = document.getElementById('course-list');
const totalCoursesEl = document.getElementById('total-courses');
const modalEl = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalDesc = document.getElementById('modal-desc');
const modalLesson = document.getElementById('modal-lesson');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBottomClose = document.getElementById('modal-bottom-close');
const roleToggleBtn = document.getElementById('role-toggle-btn');

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// 1. Fetch courses dynamically from SQLite Backend API
async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Failed to load courses');
    courses = await res.json();
    renderCourses();
  } catch (err) {
    courseListEl.innerHTML = `<p style="color: #ef4444;">Could not load courses from server. Make sure 'node server.js' is running.</p>`;
  }
}

// 2. Render Courses into Elevated Cards
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
      <button class="btn btn-primary" type="button" onclick="showCourseDetails(${c.id})">View Lessons & Quiz Overview</button>
    </article>
  `).join('');
}

// 3. Open Modal with Course Lesson Details
window.showCourseDetails = function (id) {
  const c = courses.find(item => item.id === id);
  if (!c) return;
  modalTitle.textContent = c.title;
  modalCategory.textContent = c.category;
  modalDesc.textContent = c.description;
  modalLesson.textContent = c.lessons_text;
  modalEl.style.display = 'flex';
};

function closeModal() {
  modalEl.style.display = 'none';
}

modalCloseBtn.addEventListener('click', closeModal);
modalBottomClose.addEventListener('click', closeModal);
modalEl.addEventListener('click', (e) => {
  if (e.target === modalEl) closeModal();
});

let isInstructor = false;
roleToggleBtn.addEventListener('click', () => {
  isInstructor = !isInstructor;
  roleToggleBtn.textContent = isInstructor ? "Switch View: Instructor" : "Switch View: Student";
});

loadCourses();