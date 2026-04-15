# 🎓 College Event Management System

A production-grade, full-stack web application for managing college events — from creation and registration to attendance tracking, certificate generation, and analytics.

Built as a **DBMS course project** demonstrating BCNF-normalized relational design, ACID-compliant stored procedures, and a modern SaaS-style user interface.

## 👥 Team — Pentagon

| Member | Role |
|---|---|
| Asim Khamari | Database Design & SQL |
| Sagar Sahu | Backend API Development |
| Asish Kumar Das | Frontend UI/UX |
| Mayank Kumar Khastagir | Testing & Documentation |
| Ronnic Wilmer Ekka| ER Diagram & Documentation |

---

## 📸 Screenshots

#### Login and Registration Interface
<img width="1244" height="395" alt="image" src="https://github.com/user-attachments/assets/7f4219bb-efc6-4069-b9e0-e1b02500cccf" />

#### Seat/Capacity Management: Limit registrations based on available slots
<img width="1113" height="864" alt="image" src="https://github.com/user-attachments/assets/53806c26-9352-4725-a939-5a0038789139" />

#### Participation Tracking: Track which students have registered, attended, or completed events; manage participation status
#### Certificates & Results: Generate participation or winner certificates
<img width="645" height="694" alt="image" src="https://github.com/user-attachments/assets/220e8f56-7598-4acc-b338-04ffc077f63c" />


#### Event Creation: Organizers can create and manage events with details such as event name, date, venue, description, and capacity
<img width="1052" height="664" alt="image" src="https://github.com/user-attachments/assets/b7dc8cb1-b68e-4caf-917a-5aab4eccdf9f" />


#### Student Registration: Students can register for events, and the system stores participant details in the database
<img width="661" height="668" alt="image" src="https://github.com/user-attachments/assets/147a2e75-4e75-4e6b-a710-8d69cd6f381e" />


#### Feedback System: Collect feedback from participants
<img width="660" height="728" alt="image" src="https://github.com/user-attachments/assets/80dd1dc6-79db-4cb9-8dcf-21ae74c2dd79" />


#### Event Categories: Technical, cultural, sports, etc.
<img width="1044" height="622" alt="image" src="https://github.com/user-attachments/assets/b528899f-824b-4ff9-a0c0-4f450a8679b3" />

<img width="705" height="737" alt="image" src="https://github.com/user-attachments/assets/28cfcbd7-8001-468e-938e-3b00daae5dd8" />


#### Notifications: Send updates or reminders about upcoming events, registration deadlines, or changes
<img width="1233" height="608" alt="image" src="https://github.com/user-attachments/assets/6012c227-2851-47cb-bf36-4efbbbd84609" />

---

## ✨ Features

### 👨‍🎓 Student Portal
| Feature | Description |
|---|---|
| **Event Discovery** | Browse, search, filter, and sort events by category, date, or keyword |
| **One-Click Registration** | Register for events with real-time seat availability tracking |
| **My Events** | View all registered events with status timeline (Registered → Attended → Completed) |
| **Notifications** | Real-time bell icon with unread badge, auto-polling every 30 seconds |
| **Feedback & Ratings** | Submit 1–5 star ratings and comments for attended events |
| **Certificates** | Download participation certificates for completed events |

### 🛡️ Admin / Organizer Portal
| Feature | Description |
|---|---|
| **Event Creation** | Create events with category, venue, capacity, pricing, and date selection |
| **Attendance Tracking** | Expandable participant table with manual check-in buttons |
| **Certificate Generation** | One-click certificate issuing per student (SHA-256 hashed) |
| **Analytics Dashboard** | Popular events ranking, department participation stats |
| **Event Cancellation** | Cancel events with automatic notification to all registrants |
| **Notification Broadcasting** | Auto-notify all students when new events are created |

### 🔐 Security
| Feature | Description |
|---|---|
| **JWT Authentication** | Stateless token-based auth with 24-hour expiry |
| **Role-Based Access Control** | 3 roles: `student`, `organizer`, `admin` with route-level protection |
| **Password Hashing** | bcrypt with salt rounds for secure credential storage |
| **HTTP Security** | Helmet.js for secure headers, CORS configuration |

---

## 🏗️ Architecture

<img width="650" height="754" alt="image" src="https://github.com/user-attachments/assets/1210edb4-aebd-4a5a-82ae-9299074c9577" />


---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Database** | MySQL 8.0+ (InnoDB) | BCNF-normalized relational storage, stored procedures, FULLTEXT search |
| **Backend** | Node.js 20 LTS | Server runtime |
| **API Framework** | Express.js 4.x | RESTful API routing, middleware pipeline |
| **DB Driver** | mysql2/promise | Connection pooling, prepared statements |
| **Auth** | jsonwebtoken + bcryptjs | JWT tokens + password hashing |
| **Security** | helmet + cors | HTTP header hardening, cross-origin policy |
| **Logging** | morgan | HTTP request logging |
| **Frontend** | React 18 | Component-based SPA with hooks |
| **Build Tool** | Vite 6 | HMR dev server, optimized builds |
| **Styling** | Tailwind CSS 3 | Utility-first CSS with custom design system |
| **Icons** | lucide-react | Modern SVG icon library |
| **HTTP Client** | Axios | API calls with interceptors for JWT auto-attach |
| **Routing** | react-router-dom 6 | Client-side SPA routing |
| **Dev Tool** | nodemon | Auto-restart on backend file changes |

---

## 📁 Project Structure

```
Pentagon-DBMS-Project/
│
├── sql/                              # Database layer
│   ├── 01_schema.sql                 # DDL — 9 tables, FKs, indexes, constraints
│   ├── 02_seed_data.sql              # DML — 10 users, 7 events, sample data
│   ├── 03_stored_procedures.sql      # 4 stored procedures (ACID-safe)
│   └── 04_queries.sql                # 12 analytical queries (JOINs, aggregations)
│
├── backend/                          # API server
│   ├── config/
│   │   └── db.js                     # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── authController.js         # Register, login, profile
│   │   ├── eventController.js        # CRUD events, cancel, participants
│   │   ├── registrationController.js # Register, cancel, attendance, certificates
│   │   ├── feedbackController.js     # Submit and fetch event feedback
│   │   ├── notificationController.js # Fetch, mark-read notifications
│   │   └── analyticsController.js    # Reports, trends, department stats
│   ├── middleware/
│   │   └── auth.js                   # JWT verify + role authorization
│   ├── routes/
│   │   └── api.js                    # All 21 route definitions
│   ├── scripts/
│   │   └── fix_passwords.js          # Utility to re-hash seed passwords
│   ├── server.js                     # Express app entry point
│   ├── package.json
│   └── .env                          # Environment variables (not in git)
│
├── frontend/                         # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Navigation + notification bell + dropdown
│   │   │   ├── Login.jsx             # Login form with JWT handling
│   │   │   ├── Register.jsx          # New user registration form
│   │   │   ├── StudentDashboard.jsx  # Event discovery, search, filter, cards
│   │   │   ├── EventDetailModal.jsx  # Event details, registration, feedback
│   │   │   ├── MyEvents.jsx          # Student's registered events list
│   │   │   ├── AdminDashboard.jsx    # Event creation, attendance, analytics
│   │   │   ├── ProtectedRoute.jsx    # Role-based route guard
│   │   │   └── Toast.jsx             # Toast notification system
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth state management
│   │   ├── utils/
│   │   │   └── api.js                # Axios instance with JWT interceptor
│   │   ├── App.jsx                   # Root router + layout
│   │   ├── main.jsx                  # React DOM entry point
│   │   └── index.css                 # Global styles + Tailwind base
│   ├── tailwind.config.js            # Custom theme: brand colors, animations
│   ├── vite.config.js                # Dev proxy /api → localhost:3000
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Design

### Normalization: BCNF (Boyce-Codd Normal Form)

All 9 tables satisfy BCNF — every determinant is a candidate key:

- **No partial dependencies**: Every non-key attribute depends on the entire primary key
- **No transitive dependencies**: Event categories and venues are extracted into separate lookup tables
- **No redundancy**: Organizer details are stored once in `users`, referenced by FK in `events`

### Tables Overview

| # | Table | Rows | Purpose |
|---|---|---|---|
| 1 | `users` | 10 | Students, organizers, and admins |
| 2 | `event_categories` | 5 | Lookup table (Technical, Cultural, Sports, Workshop, Seminar) |
| 3 | `venues` | 7 | Campus venues with capacity and facilities |
| 4 | `events` | 7+ | Event details, status lifecycle, seat management |
| 5 | `registrations` | 25+ | Student-event enrollment with status tracking |
| 6 | `attendance` | 10+ | Check-in records linked to registrations |
| 7 | `feedback` | 6+ | Star ratings (1-5) and comments per event |
| 8 | `certificates` | 6+ | SHA-256 hashed certificate records |
| 9 | `notifications` | 6+ | User notifications with read/unread state |

### Entity-Relationship Diagram

<img width="1179" height="772" alt="Screenshot 2026-04-12 at 6 40 37 PM" src="https://github.com/user-attachments/assets/e3684dd6-134d-4085-b2ea-faadf22da4c0" />

### Foreign Key Relationships (12 total)

| From Table | Column | → To Table | Column | ON DELETE | ON UPDATE |
|---|---|---|---|---|---|
| `events` | `category_id` | `event_categories` | `category_id` | RESTRICT | CASCADE |
| `events` | `venue_id` | `venues` | `venue_id` | RESTRICT | CASCADE |
| `events` | `organizer_id` | `users` | `user_id` | RESTRICT | CASCADE |
| `registrations` | `user_id` | `users` | `user_id` | CASCADE | CASCADE |
| `registrations` | `event_id` | `events` | `event_id` | CASCADE | CASCADE |
| `attendance` | `registration_id` | `registrations` | `registration_id` | CASCADE | CASCADE |
| `certificates` | `registration_id` | `registrations` | `registration_id` | CASCADE | CASCADE |
| `feedback` | `user_id` | `users` | `user_id` | CASCADE | CASCADE |
| `feedback` | `event_id` | `events` | `event_id` | CASCADE | CASCADE |
| `notifications` | `user_id` | `users` | `user_id` | CASCADE | CASCADE |
| `notifications` | `event_id` | `events` | `event_id` | SET NULL | CASCADE |

### Indexes (for Query Optimization)

| Table | Index | Type | Purpose |
|---|---|---|---|
| `users` | `idx_users_role` | B-TREE | Filter by role |
| `users` | `idx_users_department` | B-TREE | Department analytics |
| `events` | `ft_events_search` | FULLTEXT | Natural language search on event_name + description |
| `events` | `idx_events_date` | B-TREE | Sort by event date |
| `events` | `idx_events_status` | B-TREE | Filter by status |
| `registrations` | `uq_user_event` | UNIQUE | Prevent duplicate registrations |
| `registrations` | `idx_reg_status` | B-TREE | Filter by registration status |
| `notifications` | `idx_notif_user_read` | COMPOSITE | Fetch unread notifications per user |
| `notifications` | `idx_notif_sent` | B-TREE (DESC) | Order by newest first |
| `feedback` | `uq_feedback_user_event` | UNIQUE | One review per student per event |
| `certificates` | `certificate_hash` | UNIQUE | Verify certificate authenticity |

### Stored Procedures (ACID Compliance)

| # | Procedure | Purpose | Concurrency Strategy |
|---|---|---|---|
| 1 | `sp_register_student` | Register a student for an event | `SELECT ... FOR UPDATE` (pessimistic locking) at SERIALIZABLE isolation |
| 2 | `sp_cancel_registration` | Cancel registration and restore seat | `SELECT ... FOR UPDATE` |
| 3 | `sp_cancel_event` | Cancel event, bulk-cancel registrations, notify users | Transaction with bulk UPDATE + INSERT...SELECT |
| 4 | `sp_mark_attendance` | Mark a student as attended | `INSERT ... ON DUPLICATE KEY UPDATE` |

### CHECK Constraints

| Table | Constraint |
|---|---|
| `venues` | `capacity > 0` |
| `events` | `max_capacity > 0` |
| `events` | `available_seats <= max_capacity` |
| `events` | `end_date IS NULL OR end_date > event_date` |
| `feedback` | `rating BETWEEN 1 AND 5` |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new user account |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token |
| `GET` | `/api/auth/me` | Bearer | Get current user profile |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events` | Bearer | List all events (with search, filter, sort, pagination) |
| `GET` | `/api/events/:id` | Bearer | Get single event details |
| `POST` | `/api/events` | Organizer/Admin | Create a new event (+ auto-notify students) |
| `PUT` | `/api/events/:id` | Organizer/Admin | Update event details |
| `POST` | `/api/events/:id/cancel` | Organizer/Admin | Cancel event (+ auto-notify registrants) |
| `GET` | `/api/events/:id/participants` | Organizer/Admin | List registered students |

### Registration & Attendance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/events/:id/register` | Student | Register for event (stored procedure) |
| `DELETE` | `/api/events/:id/register` | Student | Cancel registration (stored procedure) |
| `POST` | `/api/events/:id/attendance` | Organizer/Admin | Mark student attendance (stored procedure) |
| `POST` | `/api/events/:id/certificates` | Organizer/Admin | Generate certificate for attended student |

### Feedback
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/events/:id/feedback` | Student | Submit rating + comment |
| `GET` | `/api/events/:id/feedback` | Bearer | Get event feedback with summary |

### User Resources
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me/registrations` | Bearer | Get my registered events + certificates |
| `GET` | `/api/users/me/notifications` | Bearer | Get notifications with unread count |
| `PATCH` | `/api/notifications/:id/read` | Bearer | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Bearer | Mark all notifications as read |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/events/:id/attendance` | Organizer/Admin | Event attendance rate |
| `GET` | `/api/analytics/events/:id/feedback` | Organizer/Admin | Event feedback statistics |
| `GET` | `/api/analytics/departments` | Organizer/Admin | Department-wise participation |
| `GET` | `/api/analytics/trends` | Organizer/Admin | Monthly event trends |
| `GET` | `/api/analytics/popular-events` | Bearer | Top events by fill rate |
| `GET` | `/api/analytics/student-engagement` | Admin | Per-student activity summary |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x ([Download](https://nodejs.org/))
- **MySQL** ≥ 8.0 ([Download](https://dev.mysql.com/downloads/mysql/) or `brew install mysql`)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Pentagon-DBMS-Project.git
cd Pentagon-DBMS-Project
```

### 2. Set Up the Database

```bash
# Start MySQL and login
mysql -u root -p

# Inside MySQL shell, run the SQL files in order:
source sql/01_schema.sql;
source sql/02_seed_data.sql;
source sql/03_stored_procedures.sql;
# (04_queries.sql is for reference only)
```

### 3. Configure Backend

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=college_events
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
ADMIN_REGISTRATION_KEY=change_this_admin_signup_key
ENABLE_DEBUG_ENDPOINT=false
PORT=3000
```

Fix seed passwords (one-time):
```bash
node scripts/fix_passwords.js
```

### 4. Configure Frontend

```bash
cd ../frontend
npm install
```

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ MySQL connected | Server on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ✅ Vite dev server on http://localhost:5173
```

### 6. Open in Browser

Navigate to **http://localhost:5173**

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🔴 Admin | `arjun.mehta@iiit-bh.ac.in` | `Password123!` |
| 🟡 Organizer | `priya.sharma@iiit-bh.ac.in` | `Password123!` |
| 🟢 Student | `sneha.reddy@iiit-bh.ac.in` | `Password123!` |
| 🟢 Student | `ananya.patel@iiit-bh.ac.in` | `Password123!` |

---

## 📊 SQL Highlights

### Complex Queries Used (04_queries.sql)

| # | Query | SQL Concepts |
|---|---|---|
| A1 | Full event listing | 3-table INNER JOIN |
| A2 | Full-text event search | `MATCH...AGAINST` in NATURAL LANGUAGE MODE |
| A3 | Filter by category + date range | `BETWEEN`, compound `WHERE` |
| A4 | Student's registered events | JOIN with registration status |
| A5 | Popular events by fill rate | Computed columns, `ROUND()`, `ORDER BY` |
| A6 | Participant list with attendance | `LEFT JOIN`, `CASE WHEN` |
| B1 | Update event details | `UPDATE` with `CURRENT_TIMESTAMP` |
| B2 | Mark attendance | `INSERT...SELECT` with `ON DUPLICATE KEY UPDATE` |
| C1 | Event attendance rate | `GROUP BY`, `COUNT`, `NULLIF`, percentage calc |
| C2 | Average feedback per event | `AVG()`, `MIN()`, `MAX()`, `GROUP BY` |
| C3 | Department analytics | `COUNT(DISTINCT ...)`, multi-column grouping |
| C4 | Monthly trend report | `DATE_FORMAT()`, `SUM()`, `AVG()` |
| C5 | Top-rated events | `HAVING` clause with threshold |
| C6 | Student engagement summary | Conditional `COUNT(DISTINCT CASE WHEN...)` |

### Concurrency Control

The `sp_register_student` stored procedure demonstrates **pessimistic locking**:

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
START TRANSACTION;

-- Lock the event row to prevent concurrent seat modifications
SELECT available_seats, status FROM events
WHERE event_id = p_event_id FOR UPDATE;

-- ... validation checks ...

-- Atomic: insert registration + decrement seat
INSERT INTO registrations (user_id, event_id, status) VALUES (...);
UPDATE events SET available_seats = available_seats - 1 WHERE event_id = ...;

COMMIT;
```

This ensures that even under 100 concurrent registrations, **no two students can claim the last seat** (no overbooking).

---

## 🧪 Testing Checklist

- [x] Student registers for event → seat count decreases
- [x] Student cancels registration → seat count restored
- [x] Duplicate registration → 409 Conflict error
- [x] Register for full event → 409 No Seats error
- [x] Admin creates event → all students receive notification
- [x] Admin marks attendance → registration status → "attended"
- [x] Admin generates certificate → status → "completed", hash stored
- [x] Student submits feedback → rating + comment saved, average updates
- [x] Duplicate feedback → 409 error (one review per student per event)
- [x] JWT expires → 401 redirect to login
- [x] Student tries admin route → 403 Forbidden
- [x] Cancel event → all registrants notified, seats restored

---

## 📜 License

This project was built for academic purposes as part of the DBMS course curriculum.

---

## 🙏 Acknowledgments

- University faculty for course guidance
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
