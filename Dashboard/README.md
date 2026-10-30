# 🚀 Ravi Ardhana - Dynamic Developer Portfolio & Analytics Dashboard

A modern, high-performance developer portfolio website and dynamic management dashboard. Built with Tailwind CSS, Chart.js, Typed.js, and a zero-dependency Python SQLite backend (with automatic browser LocalStorage fallback).

---

## 🌟 Key Features

### 1. 💼 Projects & Timeline Tracker
- **Project Catalog (Full CRUD)**: Add, edit, and organize software builds, web apps, and system utilities.
- **Milestone Timeline Dates**: Record start dates and completion dates for each build.
- **⏱️ How Long It Took to Complete**: Automatically calculates or lets you customize the exact duration (e.g. `3 weeks (21 days)`, `2.5 months`, `6 weeks`).
- **Visual Progress Bar**: Shows completion status (Completed vs. In Progress) and duration badges.
- **Tech Stack & Links**: Tag technologies and link directly to live demos and GitHub source repositories.

### 2. ⚡ Technical Skills & Learning Duration
- **Technical Capabilities (Full CRUD)**: Add skills with emoji icons, categories (*Frontend Core*, *Backend/Logic*, *Algorithms & DS*, *Tools & DevOps*, *Database*).
- **Proficiency Meter**: Interactive slider (10%–100%) showing current proficiency.
- **⏱️ How Long It Took to Learn**: Record the time invested to achieve mastery (e.g. `4.5 months (180 hrs)`, `6 months (220 hrs)`).
- **Linked Roadmap Topics**: Directly link pending concepts to any skill with 1-click navigation.

### 3. 🎯 Roadmap: To-Do Topics & Concepts (Linked to Skills)
- **Concept Queue**: Track upcoming architectural patterns, concurrency models, data structures, and algorithms to cover soon.
- **Skill Association**: Dynamically linked to your technical skills (e.g. *JavaScript* ➔ *Event Loop & Microtasks*, *Python* ➔ *Asyncio*, *C/Algorithms* ➔ *Segment Trees & Bitmask DP*).
- **Priority & Deadlines**: Set priority (*High*, *Medium*, *Low*), target completion dates, and study notes/doc links.
- **1-Click Status Cycle**: Quickly toggle status between `To Do`, `In Progress`, and `Mastered`.
- **Skill Mastery Progress**: Visual progress bars showing percentage of queued concepts mastered per skill.

### 4. 💻 LeetCode Problem Tracker & Analytics
- **Granular Temporal Metrics**:
  - **📅 Solved Today (Per Day)**: Daily solved count with daily target progress.
  - **📆 Solved This Week (Per Week)**: Weekly solved count with weekly goal indicator.
  - **🗓️ Solved This Month (Per Month)**: Monthly count across October, September, August, etc.
  - **🏆 Total Solved**: Overall solved count toward target (e.g. 300+ problems).
  - **🔥 Active Streak**: Consecutive active problem-solving streak counter.
- **Interactive Chart.js Visualizer**:
  - Switch between **Per Day** (last 14 days), **Per Week** (last 6 weeks), and **Per Month** (last 4 months).
  - Stacked bars showing Easy, Medium, and Hard challenge breakdowns.
  - **Difficulty Split Doughnut**: Real-time proportional split of Easy vs. Medium vs. Hard solves.
- **Problem Log (Full CRUD)**:
  - Log problem #, title, difficulty, topic tag, date, time taken (minutes), URL, and algorithmic approach/complexity notes.
  - Filter by search query, difficulty, and timeframe (Today / This Week / This Month).
  - **1-Click Quick Logger**: Fast `+ Easy`, `+ Medium`, `+ Hard` buttons for rapid logging.
  - **CSV Export**: Export all LeetCode solves to CSV.

### 5. ✏️ Bio & Profile Customizer
- Update full name, current role, headline prefix, and animated Typed.js strings.
- **Narrative Bio**: Full editable biography for the About Me section.
- **Target Goals & Links**: Update LeetCode profile URL, GitHub, LinkedIn, Instagram, phone, email, and resume URL.

### 6. ✉️ Contact Inquiries & Leads Inbox
- Live inquiries submitted through the portfolio contact form are routed instantly to the dashboard inbox.
- Mark as replied, launch email client (`mailto:`), or export messages to CSV.

---

## 📁 Architecture & Directory Structure

```text
ravi-portfolio-dashboard/
├── index.html               # Public developer portfolio with live stats & roadmap
├── dashboard.html           # Dynamic Admin, CMS & LeetCode analytics dashboard
├── server.py                # Zero-dependency Python 3 HTTP + SQLite REST server
├── README.md                # Comprehensive documentation
├── js/
│   ├── app-storage.js       # Dual-mode state engine (REST API + LocalStorage fallback)
│   ├── portfolio.js         # Public portfolio renderer & event handler
│   └── dashboard.js         # Dashboard controller, Chart.js configs, CRUD & filters
└── data/
    ├── initial-data.json    # Seed data (projects with timeline, skills, topics, leetcode)
    └── portfolio.db         # Auto-generated SQLite database
```

---

## ⚡ How to Run

### Option 1: Full-Stack Mode with Python (Recommended)

1. Open PowerShell or Terminal.
2. Navigate to the project directory:
   ```powershell
   cd "C:\Users\ACER\.gemini\antigravity\scratch\ravi-portfolio-dashboard"
   ```
3. Start the server (uses Python standard library, zero `pip` packages required):
   ```powershell
   python server.py
   ```
4. Open in your browser:
   - **Dynamic Dashboard**: [http://localhost:8000/dashboard.html](http://localhost:8000/dashboard.html)
   - **Public Portfolio**: [http://localhost:8000/index.html](http://localhost:8000/index.html)
   - **REST API Endpoint**: [http://localhost:8000/api/data](http://localhost:8000/api/data)

### Option 2: Standalone Browser Mode (No Server Required)

1. Double-click `dashboard.html` or `index.html` in Windows Explorer to open them directly in your browser.
2. The built-in state engine automatically switches to **LocalStorage Mode**, saving all your projects, skills, concepts, and LeetCode logs in persistent browser storage.
3. You can also export your full database to JSON anytime via **Export JSON**.
