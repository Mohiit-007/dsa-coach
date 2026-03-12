# ⚡ DSA-coach — Full MERN SaaS

> AI-powered DSA coach with Striver A2Z integration, code analyzer, MCQ practice, and smart progress tracking.

---

## 📦 Project Structure

```bash
dsa-coach/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/auth.js        # JWT auth + usage limit
│   ├── models/
│   │   ├── User.js               # User profile, streak, problemsSolved
│   │   ├── Analysis.js           # Code analysis result
│   │   ├── DsaProblem.js         # Striver A2Z problems
│   │   ├── DsaStatus.js          # Per‑user DSA solved / revision
│   │   └── McqAttempt.js         # MCQ quiz attempts
│   ├── routes/
│   │   ├── auth.js               # Register, login, profile
│   │   ├── analysis.js           # Code analyzer + stats
│   │   ├── learn.js              # MCQs, learning path, explainer, topic strength
│   │   └── dsa.js                # Striver DSA practice APIs
│   ├── scripts/
│   │   └── extract_striver_pdf.js # Build Striver JSON from PDF
│   ├── seed.js                   # Seed DB with Striver A2Z questions
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx        # Marketing page
        │   ├── Login.jsx / Register.jsx
        │   ├── Dashboard.jsx      # Global stats + charts
        │   ├── Analyzer.jsx       # Code analyzer (LLM)
        │   ├── CodeExplainer.jsx  # Step-by-step code explanation
        │   ├── History.jsx
        │   ├── PracticeList.jsx   # Striver A2Z DSA Practice
        │   ├── TopicProblems.jsx  # (legacy topic view – now replaced by PracticeList)
        │   ├── MockInterview.jsx  # DSA MCQ practice system
        │   ├── LearningPath.jsx   # AI-generated study plan
        │   ├── TopicStrength.jsx  # Pattern/algorithm strength
        │   ├── Pricing.jsx
        │   └── Profile.jsx        # User + stats (DSA solved, streak)
        ├── components/
        │   └── AppLayout.jsx      # Sidebar shell
        ├── context/
        │   └── AuthContext.jsx    # JWT auth + user state
        └── api/axios.js           # Axios instance with interceptors
```

---

## 🚀 Main Features

- **Striver A2Z DSA Practice**
  - Imports all ~455 Striver A2Z questions into MongoDB from the official PDF.
  - Beginner-friendly topic order (Basics → Sorting → Arrays → … → Graphs / DP / Trie).
  - Per‑topic accordion UI with Easy → Medium → Hard sorting and solved / total counts.
  - LeetCode + GFG **search links** for each problem (no homepage redirects).
  - Daily Problem of the Day, ring progress, and per‑topic progress bars.
  - Per‑user **DSA streak**, **DSA Problems Solved**, and a **list of recently solved DSA questions** surfaced on Dashboard + Profile (persists across logout / login).

- **Code Analyzer**
  - Paste a problem title + code; backend (Groq Llama‑3.3) returns:
    - Algorithm pattern, difficulty, current vs optimal time/space complexity.
    - Beginner-friendly analysis, hints, and interview follow‑up questions.
    - Related problems with LeetCode links.
  - Frontend shows a **normalized complexity comparison chart** (your code vs optimal).

- **Code Explainer**
  - Explains any snippet step‑by‑step:
    - Summary, key variables, algorithm used.
    - Current & optimal complexities.
    - Execution walkthrough (input → steps → output) and algorithm flow steps.

- **DSA MCQ Practice (Mock Interview)**
  - Topic + difficulty based MCQs (10 per quiz).
  - Modern quiz UI: question strip, responsive question card, review mode.
  - After finishing, backend stores `McqAttempt` and generates:
    - Score, accuracy, weak concepts, recommended problems.
  - Setup screen shows your **last quiz result**.

- **Dashboard & Profile**
  - Overview of analyses, optimal solutions, overall accuracy, DSA Problems Solved, MCQ performance.
  - Profile page shows DSA streak, total analyses, and lets you edit bio + social links.

---

## ⚙️ Setup

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Groq API key from [`console.groq.com`](https://console.groq.com)

### 1. Backend

```bash
cd backend
npm install
# Create .env (see example below)
npm run dev   # http://localhost:5000
```

### 2. Generate Striver questions (if needed)

If you need to rebuild the Striver dataset from the PDF:

```bash
node backend/scripts/extract_striver_pdf.js "path/to/Striver A2Z ...Sheet1.pdf"
```

This writes `data/striver_456_questions.json`. Then seed Mongo:

```bash
cd backend
node seed.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## 🔑 Environment Variables (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/leetcode-ai-coach

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d

GROQ_API_KEY=sk-your-groq-key-here
NODE_ENV=development
CLIENT_URL=http://localhost:5173

FREE_DAILY_LIMIT=10          # daily AI analysis limit for free users
```

> Note: this project focuses on analysis, DSA practice, and MCQs – there is no external code-execution service wired in right now.

---

## 📡 Key API Endpoints (summary)

### Auth

| Method | Endpoint             | Description    |
|--------|----------------------|----------------|
| POST   | `/api/auth/register` | Create account |
| POST   | `/api/auth/login`    | Sign in        |
| GET    | `/api/auth/me`       | Current user   |
| PUT    | `/api/auth/profile`  | Update profile |

### Analysis

| Method | Endpoint                       | Description           |
|--------|--------------------------------|-----------------------|
| POST   | `/api/analysis/analyze`        | Run code analysis     |
| GET    | `/api/analysis/history`        | Paginated history     |
| GET    | `/api/analysis/stats/overview` | Dashboard + DSA stats |

### Learn (MCQ, explainer, learning path)

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| POST   | `/api/learn/explain`       | Explain code for beginners           |
| GET    | `/api/learn/topic-strength`| Algorithm pattern strengths          |
| POST   | `/api/learn/learning-path` | AI learning roadmap                  |
| POST   | `/api/learn/mcq/generate`  | Generate 10 MCQs                     |
| POST   | `/api/learn/mcq/result`    | Save MCQ attempt + get AI feedback   |
| GET    | `/api/learn/mcq/last`      | Get last MCQ attempt summary         |

### DSA Practice (Striver A2Z)

| Method | Endpoint                           | Description                                  |
|--------|------------------------------------|----------------------------------------------|
| GET    | `/api/dsa/all`                     | All Striver problems + user status           |
| GET    | `/api/dsa/potd`                    | Problem of the Day                           |
| GET    | `/api/dsa/solved`                  | Recently solved problems for current user    |
| PUT    | `/api/dsa/problems/:id/status`     | Toggle solved / revision flags               |

---

## 🎨 Tech Stack

- **Frontend** – React 18, Vite, Tailwind CSS, Monaco Editor, Recharts, React Router 6, React Hot Toast.
- **Backend** – Node.js, Express, MongoDB (Mongoose), JWT, Helmet, CORS, `express-rate-limit`.
- **AI** – Groq Llama‑3.3 (`llama-3.3-70b-versatile`) via `groq-sdk`.

---

## 🚀 Deployment Checklist

1. **Backend**
   - Set `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `CLIENT_URL` on your host (Render / Railway / etc.).
   - Start command: `node server.js`.
   - Confirm health: `GET /api/health` → `"DSA-coach API is running 🚀"`.

2. **Frontend**
   - In `frontend`:
     ```bash
     npm run build
     ```
   - Deploy `dist/` to Vercel/Netlify.

3. **One-time DB seed**
   - On production, run `node backend/seed.js` once against your MongoDB to load Striver A2Z problems.

At this point the app is ready to push to GitHub or deploy.

---

## 👤 Author

**Mohit Sahu** — DSA-coach  
Built with MERN + Groq ⚡

# ⚡ DSA Coach — Full MERN SaaS

> AI-powered platform for DSA interview preparation — built with MERN + Groq AI