# LearnTrack - Day 1: Entity Relationship Diagram & User Flows

## 1. System Roles & User Flows
- **Instructor Flow:**
  - Sign up / Sign in as Instructor.
  - Access instructor dashboard to create new Courses.
  - Add text lessons and author multiple-choice questions with 4 options and 1 correct answer.
- **Student Flow:**
  - Sign up / Sign in as Student.
  - Browse public course catalog.
  - Read course lessons and attempt the course quiz.
  - Receive automated server-side score evaluation and view quiz history.

---

## 2. Relational Database Schema (`learntrack.db`)

### `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| `name` | TEXT | NOT NULL | User's full name |
| `email` | TEXT | UNIQUE NOT NULL | Login email address |
| `password` | TEXT | NOT NULL | Securely hashed password |
| `role` | TEXT | CHECK(`role` IN ('instructor', 'student')) | User access role |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### `courses` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique course identifier |
| `title` | TEXT | NOT NULL | Course title |
| `description` | TEXT | NOT NULL | Summary of the course |
| `category` | TEXT | DEFAULT 'General' | Subject area |
| `lessons_text` | TEXT | NOT NULL | Comprehensive lesson reading material |
| `instructor_id` | INTEGER | FOREIGN KEY REFERENCES `users(id)` | Creator of the course |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Publishing timestamp |

### `questions` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique question identifier |
| `course_id` | INTEGER | FOREIGN KEY REFERENCES `courses(id)` | Associated course |
| `question_text`| TEXT | NOT NULL | Multiple choice question prompt |
| `option_a` | TEXT | NOT NULL | Choice A |
| `option_b` | TEXT | NOT NULL | Choice B |
| `option_c` | TEXT | NOT NULL | Choice C |
| `option_d` | TEXT | NOT NULL | Choice D |
| `correct_option`| TEXT | CHECK(IN ('A', 'B', 'C', 'D')) | The single correct answer key |

### `attempts` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique attempt identifier |
| `user_id` | INTEGER | FOREIGN KEY REFERENCES `users(id)` | Student who took quiz |
| `course_id` | INTEGER | FOREIGN KEY REFERENCES `courses(id)` | Course tested |
| `score` | INTEGER | NOT NULL | Points scored |
| `total_questions`| INTEGER | NOT NULL | Total questions in quiz |
| `percentage` | REAL | NOT NULL | Score percentage |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |