# WellNest: Vitals Monitoring POC

A proof-of-concept (POC) for a modern vitals monitoring application, designed to evaluate three approaches for capturing health vitals: Manual Entry, Wearables Integration, and Camera-Based Estimation.

---

## 📑 Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Usage Guide](#usage-guide)
5. [Project Structure](#project-structure)
6. [Data Format](#data-format)
7. [Production Recommendations](#production-recommendations)
8. [License](#license)

---

## ✨ Features

### 📋 Core Features
| Feature | Description |
|---------|-------------|
| Dashboard | Displays all vitals with status indicators, auto-calculated BMI, and trend arrows |
| Manual Entry | Clean, validated forms for entering vitals with normal range guidance |
| History | Timeline view with search, time filters, and interactive Recharts area charts |
| Wearables | Mock integrations for Google Fit and Apple Health |
| Camera Measurement | Experimental heart rate via remote PPG (mobile/desktop modes) |
| Comparison Page | Radar chart comparing all three vitals capture methods |
| Research Page | Documentation + recommendations |
| JSON Export/View | Download vitals as JSON or view them directly in browser console |

---

## 🛠️ Tech Stack

### Frontend
- [React 18](https://react.dev) - UI framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Vite](https://vitejs.dev) - Dev server & build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide React](https://lucide.dev) - Icons
- [Recharts](https://recharts.org) - Charts & trends
- [Framer Motion](https://www.framer.com/motion) - Animations
- [date-fns](https://date-fns.org) - Date formatting

### Backend (Optional - For Production)
- [Express.js](https://expressjs.com) - Backend framework
- PostgreSQL/MySQL - Database

---

## 🚀 Quick Start

Follow these simple steps to run WellNest locally on your computer/device!

### Prerequisites
- Node.js 18+ installed (Download here: https://nodejs.org)

### Step 1: Download or Clone the Project
If you haven't already, make sure you have the project files on your computer!

### Step 2: Install Dependencies
Open your terminal/command prompt and navigate to the project folder:
```bash
cd wellnest-vitals-poc
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
The terminal will show you a local URL (usually `http://localhost:3000` or `http://localhost:5173` or similar). Open that URL in your web browser!

---

## 📖 Usage Guide

### Entering Vitals
1. Go to "Manual Entry" in the sidebar
2. Select the vital you want to track
3. Enter the required values
4. Click "Save Entry"

### Viewing History
1. Go to "History" in the sidebar
2. Use filters/search to find specific entries
3. View interactive trend charts

### Exporting Data
1. Go to "Dashboard"
2. Click either:
   - "View JSON" to see formatted data in browser console (F12 → Console)
   - "Download JSON" to download your vitals as a `.json` file

---

## 📂 Project Structure
```
wellnest-vitals-poc/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── EntryForm.tsx          # Manual entry form
│   │   ├── History.tsx            # History with charts
│   │   ├── CameraMeasure.tsx      # Camera-based measurement
│   │   ├── Wearables.tsx          # Wearable integration
│   │   ├── Comparison.tsx         # Method comparison
│   │   └── Research.tsx           # Documentation
│   ├── App.tsx                    # Main app
│   ├── types.ts                   # TypeScript types
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md                      # This file!
```

---

## 📊 Data Format

Vitals are stored in `localStorage` under `wellnest_entries` as JSON:
```json
[
  {
    "id": "crypto-generated-id",
    "type": "heartRate",
    "value": 72,
    "source": "manual",
    "timestamp": 1720396800000,
    "notes": "Morning reading"
  },
  {
    "id": "another-id",
    "type": "bloodPressure",
    "value": { "systolic": 120, "diastolic": 80 },
    "source": "camera",
    "timestamp": 1720400400000,
    "confidence": 88
  }
]
```

---

## 🏭 Production Recommendations

For production deployment, we recommend:
1. Add **Authentication** (Clerk, Auth0, or Firebase Auth)
2. Add a **Backend API** with Express.js/FastAPI
3. Use a **Database** like PostgreSQL or MongoDB
4. Add **HIPAA/GDPR** compliance features
5. Replace mock wearable APIs with real integrations

---

## 📄 License
MIT License - Use this POC for research and development!
