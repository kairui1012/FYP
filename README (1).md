# Multilingual Educational Community Platform

> A web-based educational community platform designed for Malaysian students, supporting English, Bahasa Malaysia, and Mandarin. Built to address language barriers, low interaction, and limited motivation in existing digital learning platforms.

**Author:** Sam Kai Rui (TP074684)
**Programme:** APU3F2509SE — Bachelor of Science (Hons) in Software Engineering
**Supervisor:** TS. Nicholas Teh Sek Kit
**2nd Marker:** TS. Dr. Law Foong Li
**Institution:** Asia Pacific University of Technology and Innovation (APU)
**SDG Alignment:** SDG 4 — Quality Education

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Features](#-features)
4. [Project Scope](#-project-scope)
5. [Installation & Setup](#-installation--setup)
6. [Project Structure](#-project-structure)
7. [Development Methodology](#-development-methodology)
8. [Target Users](#-target-users)
9. [License & Acknowledgement](#-license--acknowledgement)

---

## 🎯 Project Overview

This project aims to develop a multilingual educational community platform that helps Malaysian students:

- Ask questions and receive peer support across language barriers.
- Share study resources (PDFs, Office documents, images, video links).
- Engage in asynchronous peer-to-peer learning.
- Stay motivated through gamification (points, badges, leaderboards).

The platform addresses three key problems identified in the investigation:

1. Existing platforms (Google Classroom, Moodle, Microsoft Teams) lack proper multilingual support.
2. Students from rural areas and lower-income backgrounds face unequal access to learning resources.
3. Low interactivity and motivation in current online learning environments.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Laravel (PHP) |
| **Bridge** | Inertia.js (no separate REST API needed) |
| **Build Tool** | Vite |
| **Database** | MySQL |
| **Authentication** | Laravel Breeze + Google OAuth |
| **Multilingual** | React-i18next |
| **File Upload** | React Dropzone |
| **Dependency Management** | Composer (PHP), npm (JS) |
| **Test Data** | FakerPHP |
| **IDE** | Visual Studio Code |
| **Browser** | Google Chrome |
| **OS** | Windows |

---

## ✨ Features



### 📎 4. File & Resource Sharing
- PDF document upload (84.4% user demand). ☑️
- Microsoft Office file upload — Word, Excel, PowerPoint.

### ❤️ 5. Interaction
- Upvote / like posts and answers (68.8% user demand). ☑️
- Optional downvote mechanism. ☑️

### 🏆 6. Gamification
- Points system for contributions (motivating for 59.4% of users). ☑️
- Virtual badges and achievements (top-preferred by 65.6% of users). ☑️
- Public leaderboard. ☑️
- **Leaderboard privacy toggle** — respects 15.6% of users who prefer privacy.
- User levels and XP progression. ☑️
- Achievement unlocks for receiving likes or followers. ☑️

### 👤 7. User Profile
- View and edit profile (avatar, username, bio). ☑️
- Personal post and reply history. ☑️
- Bookmarked posts list. ☑️
- Badges, points, and level display. ☑️
- Following and followers list. ☑️
- Privacy settings (leaderboard visibility, profile visibility).
- Language preference.

### 🎨 8. UI / UX
- Fast load times and smooth response (75% of users rate speed as essential).
- Clear navigation and accessibility features. ☑️
- Modern, clean interface (avoids the "Scroll of Death" problem seen in Moodle). ☑️
- Performance optimisation: image compression, database indexing, lazy loading.
- In-app user guide.

### ⚙️ 9. System Utilities
- Content reporting.
- Friendly 404 / 500 error pages.
- Front-end and back-end form validation. ☑️
- Basic activity logging for points calculation. ☑️

### 未完成项
以下是当前 README Features 里仍未打 ☑️ 的项目：

- Microsoft Office file upload — Word, Excel, PowerPoint.
- Video link embedding (no native video upload, to preserve server performance).
- **Leaderboard privacy toggle** — respects 15.6% of users who prefer privacy.
- Privacy settings (leaderboard visibility, profile visibility).
- Language preference.
- Fast load times and smooth response (75% of users rate speed as essential).
- Performance optimisation: image compression, database indexing, lazy loading.
- In-app user guide.
- Content reporting.
- Friendly 404 / 500 error pages.

**完成率：39 / 49 = 79.6%**

---

## 📋 Project Scope

### ✅ Inclusions
- Web-based platform only.
- Three-language support: English, Bahasa Malaysia, Mandarin.
- Q&A community with peer-to-peer interaction.
- Gamification and engagement features.

### ❌ Exclusions
- No official educational content (avoids copyright issues).
- No mobile application.
- No integration with external LMS (Moodle, Teams, etc.).
- No academic performance evaluation.
- No advanced cybersecurity layers (encryption beyond basic auth, dedicated backup servers, etc.).
- No real-time chat or video calls.

### ⚠️ Constraints
- Content quality depends on user contributions.
- Time-bound by university academic timeline.
- User behaviour cannot be fully controlled.
- Long-term maintenance is out of scope.

### 📌 Assumptions
- Users contribute high-quality content.
- Users have stable internet access.
- Users understand at least one of the three supported languages.

---

## 🚀 Installation & Setup

### Prerequisites
- PHP 8.2 or higher
- Node.js 18+ and npm
- Composer
- MySQL 8.0+
- Git

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd multilingual-edu-platform

# 2. Install PHP dependencies
composer install

# 3. Install JavaScript dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Configure your database in .env
# DB_DATABASE=your_db_name
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# 7. Run migrations and seed test data (uses FakerPHP)
php artisan migrate --seed

# 8. Configure Google OAuth in .env
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# 9. Build frontend assets and start dev server
npm run dev

# 10. In a separate terminal, start the Laravel server
php artisan serve
```

The application will be available at `http://localhost:8000`.

---

## 📁 Project Structure

```
multilingual-edu-platform/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Laravel controllers
│   │   └── Middleware/
│   └── Models/               # Eloquent models (User, Post, Reply, etc.)
├── database/
│   ├── migrations/           # Database schema
│   └── seeders/              # FakerPHP seeders
├── resources/
│   ├── js/
│   │   ├── Components/       # Reusable React components
│   │   ├── Pages/            # Inertia pages
│   │   ├── Layouts/          # Page layouts
│   │   └── i18n/             # Translation files (en, ms, zh)
│   └── css/
├── routes/
│   ├── web.php               # Web routes
│   └── auth.php              # Auth routes (Breeze)
├── public/                   # Public assets and uploads
├── tests/                    # Feature and unit tests
├── .env.example
├── composer.json
├── package.json
└── README.md
```

---

## 🔄 Development Methodology

This project uses **Agile methodology** with iterative development. Each iteration delivers a working set of features that can be tested and improved upon.

**Phases:**
1. Planning & Investigation (completed in this report).
2. Requirement Analysis (data gathering via questionnaire, n=32).
3. System Design.
4. Implementation (frontend with React, backend with Laravel, integrated via Inertia.js).
5. Testing.
6. Deployment.

---

## 👥 Target Users

The primary target users are **Malaysian students**, particularly:

- Undergraduate students (84.4% of survey respondents).
- Postgraduate students.
- Adult learners.

The platform is designed for users aged 18–23 (Gen Z) who expect fast, intuitive, and mobile-friendly digital experiences.

---

## 🎓 Project Objectives

1. To investigate the challenges and limitations of existing digital learning platforms in Malaysia.
2. To develop a multilingual, user-friendly, and engaging educational community platform.
3. To evaluate system functionality in real-life learning scenarios and assess effectiveness in enhancing access to educational resources and academic support.

---

## 📜 License & Acknowledgement

This project is developed as part of the Final Year Project (FYP) requirement for the Bachelor of Science (Hons) in Software Engineering at Asia Pacific University of Technology and Innovation.

**Special thanks to:**
- TS. Nicholas Teh Sek Kit (Supervisor) — for continuous guidance and support.
- TS. Dr. Law Foong Li (2nd Marker).
- Asia Pacific University — for providing the foundation in networking, databases, design methodologies, and data structures.
- Friends and family — for ongoing support throughout this project.

---

**Contributing to SDG 4: Quality Education** — promoting inclusive and equitable access to education through technology.
