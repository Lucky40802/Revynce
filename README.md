# Revynce — AI Student Platform

> Upload a textbook, syllabus, or worksheet. Get notes, quizzes, flashcards, and a full study plan in seconds.

---

## What is Revynce?

Revynce is a full-stack AI-powered learning platform for students and teachers. It connects to Firebase for authentication, real-time data, and file storage, and uses a large language model via a secure Cloud Function proxy to power the AI Tutor.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Pure HTML/CSS/JS — single `index.html` |
| Auth | Firebase Authentication |
| Database | Firebase Realtime Database + Firestore |
| Storage | Firebase Storage |
| AI Proxy | Firebase Cloud Function (Node.js) |
| AI Model | Qwen 3.6 27B (configured in Cloud Function) |
| Fonts | Syne + DM Sans (Google Fonts) |
| Icons | Flaticon Uicons |

---

## Admin Account

An admin account gives access to a completely separate admin panel with:
- Live user counts pulled from Firestore
- Full user management table
- Activity logs
- Schools & Orgs management
- Platform analytics
- System settings (maintenance mode, feature toggles)

> **Setup:** Create the admin account via Firebase Console → Authentication → Add User, then manually set `role: "admin"` in both Firestore and RTDB under `users/{uid}`. Keep credentials out of version control.

---

## Firebase Collections

Every new signup automatically creates documents in these Firestore collections:

| Collection | Created when |
|---|---|
| `users/{uid}` | New account signup |
| `activityLog` | Signup event logged |
| `studyMaterials` | User uploads a file |
| `quizResults` | User completes a quiz |
| `classMembers` | User joins a class |

---

## Deploy Instructions

### 1. Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public dir = "." or "public", single-page = yes
firebase deploy --only hosting
```

### 2. Cloud Function (AI Proxy)

```bash
firebase init functions   # JavaScript, no ESLint
# Copy index.js into functions/index.js
cd functions && npm install
firebase functions:secrets:set GROQ_API_KEY
# Paste your API key when prompted — it is stored securely in Google Secret Manager
firebase deploy --only functions
```

> **Never commit API keys to version control.** The Cloud Function reads the key at runtime from Google Secret Manager only — it is never sent to the browser or stored in code.

### 3. Firestore Rules (recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /studyMaterials/{doc} {
      allow read, write: if request.auth != null;
    }
    match /activityLog/{doc} {
      allow write: if request.auth != null;
      allow read: if false;
    }
  }
}
```

---

## Project Structure

```
revynce/
├── index.html          ← Main app (landing, auth, student app, admin panel, pricing)
├── index.js            ← Firebase Cloud Function — AI proxy
├── firebase.json       ← Firebase project config
├── README.md           ← This file
└── .gitignore
```

---

## Pages & Panels

### Landing
- Hero section, feature grid, stats, CTA
- Navigation to Pricing, Login, Signup

### Pricing
- Monthly/Yearly billing toggle
- Free / Pro / School Student / Organisation plans
- FAQ accordion

### Auth
- Sign Up (Student / School Student / Teacher roles)
- Log In
- Admin detection on login

### Student App
- Dashboard — live XP, uploads, quiz count, streak from Firebase
- AI Upload — drag & drop, generates notes/quiz/flashcards/schedule
- AI Tutor — LLM chatbot via secure proxy
- Flashcards — flip cards
- Practice Quiz — MCQ with instant feedback and XP
- My Classes — join/create with class codes
- Study Schedule — weekly grid + daily agenda
- Pomodoro Timer — with XP rewards
- Leaderboard — podium + ranked list
- Voice Rooms
- Rewards & Badges
- Teacher Dashboard, AI Test Builder, AI Marking (teacher role only)
- Notifications
- Profile & Settings

### Admin Panel
- Completely separate interface with distinct theme
- Overview — live Firebase stats
- All Users — management table
- Activity Logs — signup history
- Schools & Orgs
- Content Library — file counts, storage usage
- Platform Analytics
- System Settings

---

## Security Notes

- API keys are stored in **Google Secret Manager** via `firebase functions:secrets:set` and injected at runtime only — never in source code or environment files
- Admin credentials should be stored privately and never committed to a repository
- Add `.env`, `serviceAccountKey.json`, and any credentials files to `.gitignore`
- Firestore rules should be configured to restrict data access per user

---

## License

© 2026 Revynce. All rights reserved.
