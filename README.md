# Pentagon-DBMS-Project

> **CampusHub — College Event Management System**  
> A centralized, database-driven application to organize, manage, and track college events.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8.0+ (InnoDB, BCNF) |
| Backend | Node.js 20 LTS + Express.js |
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 |
| Auth | JWT (RS256) + bcrypt + RBAC |

## Project Structure

```
Pentagon-DBMS-Project/
│
├── sql/                                   # Database layer
│   ├── 01_schema.sql                      #   DDL — 9 tables (BCNF)
│   ├── 02_seed_data.sql                   #   DML — Realistic test data
│   ├── 03_stored_procedures.sql           #   Stored procs (concurrency-safe)
│   └── 04_queries.sql                     #   CRUD + analytics queries
│
├── backend/                               # API layer (Express)
│   ├── config/db.js                       #   MySQL2 connection pool
│   ├── middleware/auth.js                 #   JWT + RBAC middleware
│   ├── controllers/
│   │   ├── authController.js              #   Register / Login
│   │   ├── eventController.js             #   Event CRUD
│   │   ├── registrationController.js      #   Stored proc calls
│   │   ├── feedbackController.js          #   Feedback
│   │   ├── analyticsController.js         #   Analytics queries
│   │   └── notificationController.js      #   Notifications
│   ├── routes/api.js                      #   20 RESTful routes
│   └── server.js                          #   Express bootstrap
│
├── frontend/                              # UI layer (React SPA)
│   ├── src/
│   │   ├── context/AuthContext.jsx         #   Global auth state
│   │   ├── utils/api.js                   #   Axios + JWT auto-attach
│   │   ├── components/
│   │   │   ├── Login.jsx                  #   Login form + role redirect
│   │   │   ├── Register.jsx               #   Student registration
│   │   │   ├── StudentDashboard.jsx       #   Event explorer + register
│   │   │   ├── MyEvents.jsx               #   Student's registrations
│   │   │   ├── AdminDashboard.jsx         #   Event manager + analytics
│   │   │   ├── Navbar.jsx                 #   Navigation bar
│   │   │   ├── ProtectedRoute.jsx         #   Auth/role guard
│   │   │   └── Toast.jsx                  #   Toast notifications
│   │   ├── App.jsx                        #   Router + layouts
│   │   ├── main.jsx                       #   React entry point
│   │   └── index.css                      #   Tailwind + design system
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## Prerequisites

- **Node.js** 18+ → [nodejs.org](https://nodejs.org/)
- **MySQL** 8.0+ → [dev.mysql.com](https://dev.mysql.com/downloads/)

## Quick Start

### 1. Database Setup

```bash
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_seed_data.sql
mysql -u root -p < sql/03_stored_procedures.sql
```

### 2. Start the Backend

```bash
cd backend
npm install
# Edit .env → set DB_PASSWORD
npm run dev
# Server runs at http://localhost:3000
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 4. Open the App

Visit **http://localhost:5173** in your browser.

**Demo credentials** (password: `Password123!`):
| Role | Email |
|---|---|
| Student | sneha.reddy@university.edu |
| Organizer | priya.sharma@university.edu |
| Admin | arjun.mehta@university.edu |

## License

See [LICENSE](LICENSE) for details.
