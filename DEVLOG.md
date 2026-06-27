# Revynce — Development Log

**Live site:** https://revynce.com.au  
**Repository:** https://github.com/Lucky40802/Revynce  
**Stack:** Single-file HTML app · Firebase Realtime Database · Firebase Auth · Firebase Storage · Firebase Cloud Functions v2 · Groq AI (llama-3.3-70b-versatile) · GitHub Pages

---

## Session Log (Most Recent First)

### Custom Domain — revynce.com.au
- Added `CNAME` file to repo pointing to `revynce.com.au`
- Configured GitHub Pages custom domain in repo Settings → Pages
- DNS records to add in Crazy Domains:
  - 4 × A records (`@` → `185.199.108.153 / .109 / .110 / .111`)
  - 1 × CNAME (`www` → `lucky40802.github.io`)
- HTTPS enforce to be ticked once DNS propagates (5–30 min)

---

### Organise / Reorganise Feature
Added reorganisation controls across four areas:

**Flashcard Decks**
- Drag-and-drop reorder — order persisted to `flashcardDecks/{uid}/_order` in Firebase
- Rename button on each deck card (pencil icon) → modal → saves to Firebase

**Archive Uploads**
- Pencil icon on every upload row opens an edit modal
- Rename title (`deckTitle`) and/or move to a different subject folder (`subject`)
- Delete entry from within the modal
- All changes written to Firebase individually (doesn't overwrite notes/cards/test)

**Study Schedule**
- `+ Add study block` button on each day column in the weekly grid
- Custom blocks stored in `schedule/{uid}` (separate from timetable)
- Individual ✕ delete button on each custom block

**Timetable (teachers only)**
- Filled period cells are now clickable → opens Edit Period modal
- Change subject, room, day, or period slot; moving slot deletes old key and writes new
- Delete period from within the modal
- Empty cells clickable → opens Add Period modal pre-filled with that day/period
- `renderTimetable` switched from `get(child(ref(db)))` to `window._fbGet/window._fbRef` pattern

---

### Full Error Audit — Bug Fixes
Ran a complete audit of `index.html` and fixed all critical and high-severity issues found:

- **Missing `panel-flashcards`** — `deck-grid` element didn't exist; `renderDecks()` was silently returning on null. Added full panel HTML and nav button.
- **Missing `panel-quiz`** — all 7 quiz element IDs (`quiz-q`, `quiz-opts`, `quiz-fb`, `quiz-next`, `quiz-prog`, `quiz-progress-fill`, `quiz-score-header`) were missing. Added full panel HTML, wired `initQuiz()` on panel open.
- **`loadFlashcards` race condition** — was using `get(child(ref(db),...))` (module-scoped). Switched to `window._fbGet(window._fbRef(window._db,...))` with a readiness guard.
- **`appendChat` null crash** — added `if (!box) return` guard before `box.appendChild`.
- **`useSuggestion` null crash** — added null check on `chatInput` before `.value`.

---

### JSON Parse Error Fix — AI Upload
The AI content generation was crashing when the model returned malformed JSON. Added a three-tier fallback:

1. **Strip markdown fences** (` ```json ... ``` `) then direct `JSON.parse`
2. **Repair pass** — fix unescaped literal newlines and quotes inside string values, re-parse
3. **Field-by-field rescue** — extract `title`, `notes`, `test`, `palmCards` individually with regex as last resort

---

### Google Sign-In (SR-1 completion)
- Added `GoogleAuthProvider` + `signInWithPopup` to Firebase auth imports
- Added Google Sign-In button to auth card (below email/password form)
- `doGoogleAuth()` — creates user profile on first Google login with selected role
- Requires Google enabled as a sign-in provider in Firebase console (Authentication → Sign-in method)

---

### Firebase Security Rules
- Added explicit `.read: false` / `.write: false` at root level — no path is accessible unless a child rule explicitly grants it
- Deployed rules from `database.rules.json` via `firebase deploy --only database` to override any Test Mode expiry
- Rules are now version-controlled and the file is the authoritative source

---

### System Requirements Audit (SR-1 through SR-8)
Audited all 8 system requirements against the codebase:

| SR | Requirement | Status |
|----|-------------|--------|
| SR-1 | Single unified login (email/password + Google OAuth) | ✅ Complete (Google added this session) |
| SR-2 | AI-generated study materials (PDF/DOCX/TXT/PPTX/image) | ✅ Complete |
| SR-3 | Teacher class management (roll, notices, dashboard, test builder, marking) | ✅ Complete |
| SR-4 | Student leaderboard privacy (opt-in, force-public with amber badge) | ✅ Complete |
| SR-5 | Voice collaboration rooms (Jitsi, 6-char code, 30-min free timer) | ✅ Complete |
| SR-6 | Timetable and attendance (Mon–Fri grid, 6 periods, per-subject breakdown) | ✅ Complete |
| SR-7 | Google ecosystem integration (Classroom, Drive, Calendar) | ✅ Complete |
| SR-8 | Responsive cross-device access | ✅ Complete |

---

### Archive Fix — Duplicate `loadArchive`
- Two `window.loadArchive` definitions existed; the second overwrote the correct first one
- The bad version targeted `document.getElementById('archive-folders')` which doesn't exist (actual element is `ar-folder-grid`)
- `renderArchive()` had `if (!container) return` so it silently did nothing — uploads never appeared
- Fix: removed the entire ~69-line duplicate block
- The surviving definition correctly reads from Firebase into `window._archiveData` and calls `window.renderArchiveFolders()`

---

### AI Upload Result UI Redesign
- Replaced plain `<pre>` text output with rendered markdown using custom `_mdToHtml()` parser
- Notes: `##` headings, bullet lists, **bold** key terms rendered as HTML
- Palm Cards: CSS flip-card grid — click to reveal answer
- Test: question cards with Show/Hide answer toggle per question
- Download button saves current tab as `.txt`
- HTML injection risk fixed — `c.front`, `c.back`, and question text are HTML-escaped before rendering

---

### My Classes — Crash Fix
- `loadClasses()` was crashing because `div.querySelector('[style*="arrow-right"]')` always returned null — the arrow icon was in a CSS class (`fi-rr-arrow-right`), not a style attribute
- Fix: added `class="class-open-link"` to the div and changed selector to `'.class-open-link'`
- Also added `showPanel` hook to reload classes on every panel open (`_loadClassesInFlight = false; loadClasses()`)

---

### `_addXP` Null Crash Fix
- `document.getElementById('lb-your-xp').textContent = ...` — element `lb-your-xp` doesn't exist in HTML
- This crashed every time AI content was generated (XP is awarded after generation)
- Fix: replaced all direct DOM assignments in `_addXP` with null-safe `_setText`/`_setStyle` helpers

---

## Architecture Notes

### Firebase Pattern
All Firebase reads/writes use the `window._fb*` globals pattern (set by the module script via `Object.defineProperties`):
```js
window._fbGet(window._fbRef(window._db, 'path/to/node'))
window._fbSet(window._fbRef(window._db, 'path'), value)
window._fbRemove(window._fbRef(window._db, 'path'))
```
The old `get(child(ref(db), path))` module-scoped pattern is unreliable due to async timing and has been replaced wherever found.

### Two Script Blocks
- `<script type="module">` — Firebase imports, initialisation, auth listener, exposes globals via `window._fb*`
- `<script>` — all UI logic, uses `window._fb*` globals

### Key Firebase Paths
| Path | Purpose |
|------|---------|
| `users/{uid}/profile` | User profile (name, role, plan, xp) |
| `uploads/{uid}/{key}` | AI-generated content (notes, test, palmCards, deckTitle, subject) |
| `flashcardDecks/{uid}/{key}` | Flashcard sets with cards array |
| `flashcardDecks/{uid}/_order` | Saved deck display order |
| `timetable/{uid}/{p{n}_{day}}` | Timetable periods |
| `schedule/{uid}` | Custom study blocks per day |
| `enrollments/{uid}` | Classes the user is enrolled in |
| `classes/{classCode}` | Class data (name, teacher, leaderboard settings) |
| `notifications/{uid}` | User notifications |
| `rateLimits/{uid}` | AI rate limiting |

### AI Proxy
Cloud Function at `https://us-central1-revynce-740d1.cloudfunctions.net/chat`  
Model: `llama-3.3-70b-versatile` via Groq  
Rate limiting enforced server-side per UID

---

## Pending / Known Limitations
- Google Sign-In requires enabling Google provider in Firebase console (Authentication → Sign-in method)
- HTTPS on `revynce.com.au` requires DNS propagation to complete and Enforce HTTPS to be ticked in GitHub Pages settings
- Performance panel (grades, quiz history) shows static demo data — not yet wired to real Firebase quiz scores
- Agenda list on Study Schedule is static — not connected to schedule blocks
