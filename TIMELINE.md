# Revynce — Project Timeline

---

## Phase 1 — Firebase Security Rules & Google Sign-In

### Firebase Security Rules
- Firebase database was running in Test Mode — rules would expire and anyone could read/write
- Added explicit root-level deny (`".read": false, ".write": false`) to `database.rules.json`
- Deployed rules permanently via `firebase deploy --only database`
- Rules now enforce per-user access across all data paths

### Google Sign-In
- Google Sign-In was listed as a system requirement but was not implemented
- Added `GoogleAuthProvider` and `signInWithPopup` to Firebase auth imports
- Added "Sign in with Google" button to the login/signup card with Google SVG logo
- Added `doGoogleAuth()` function to handle the popup flow
- Enabled Google as a sign-in provider in Firebase Console

---

## Phase 2 — Bug Fixes

### AI Upload JSON Parse Error
- AI-generated content was crashing due to malformed JSON responses from the Groq API
- Implemented a three-tier fallback parser:
  1. Strip markdown code fences and parse normally
  2. Repair unescaped newlines and special characters
  3. Field-by-field regex extraction as last resort

### Missing HTML Panels
- Flashcard and Quiz features had complete JavaScript and CSS but no HTML panels
- Added `panel-flashcards` with `deck-grid` element
- Added `panel-quiz` with all 7 required IDs

### Null Crash Guards
- `appendChat` crashing when chat box element was missing — added null check
- `useSuggestion` crashing on null `chatInput` — added null check
- `loadFlashcards` race condition — switched to `window._fbGet` / `window._fbRef` / `window._db` compatibility shim

---

## Phase 3 — Organise / Reorganise Feature

Added drag-and-drop reorganisation across 4 areas:

### Flashcard Decks
- Deck cards now draggable with HTML5 drag-and-drop API
- Custom order saved to `flashcardDecks/{uid}/_order` in Firebase
- Added rename button and `deck-rename-modal`

### Archive Uploads
- Each upload row now has an edit button
- Added `ar-edit-modal` to rename or delete archive entries
- `arOpenEditModal`, `arSaveEdit`, `arDeleteEntry` functions added

### Study Schedule
- Added custom study block system with `_schedBlocks` stored at `schedule/{uid}`
- Each day column has an "+ Add study block" button
- `sched-block-modal` for creating/editing blocks with subject, time, duration, notes

### Timetable Periods
- Teacher cells are now editable via `edit-period-modal`
- `openEditPeriodModal`, `saveEditPeriod`, `deletePeriod` functions
- Uses `window._fbGet/_fbRef/_db` with readiness guard

---

## Phase 4 — Custom Domain Setup

### GitHub Pages — revynce.com.au
- Created `CNAME` file in repo root with content `revynce.com.au`
- Configured Crazy Domains DNS:
  - 4 × A records for `@` pointing to GitHub Pages IPs (185.199.108–111.153)
  - CNAME for `www` pointing to `lucky40802.github.io`
- Fixed error: `www` was initially set as an A record (InvalidARecordError) — changed to CNAME
- DNS check went green in GitHub Pages settings

### HTTPS / SSL
- "Enforce HTTPS" was unavailable even after DNS check passed
- Fix: removed and re-added custom domain in GitHub Pages settings to trigger Let's Encrypt re-provisioning
- SSL certificate provisioned — HTTPS now active on revynce.com.au

---

## Phase 5 — Google Search Console Verification

- Needed to verify domain ownership for Google Search Console
- Crazy Domains plan blocked adding extra TXT records
- Switched to HTML meta tag verification method
- Added `<meta name="google-site-verification" ...>` to `<head>`
- Used URL Prefix property type in Search Console
- Ownership verified via HTML tag

---

## Phase 6 — Google OAuth Branding Verification

### Issue: "Homepage does not explain purpose of app"
Google's branding checker kept failing across multiple attempts.

**Attempt 1** — Added description paragraph in hero section  
**Attempt 2** — Added dedicated `#google-data-usage` section with cards for each integration  
**Attempt 3** — Added static HTML block at top of `<body>` (reverted — user disliked appearance)

**Root cause identified** — Google's crawler was hitting HTTP (not HTTPS) — fixed HTTPS first, then resubmitted.

**Final fix:**
- Removed text from under hero title (cleaner look)
- Added "About Revynce" section with full app description
- 4-card Google integrations section: Sign-In, Classroom, Drive, Calendar
- Each card has explicit "What we access" and "Why" text
- Privacy Policy link visible at bottom of section

**Result — Google OAuth branding VERIFIED**

---

## Phase 7 — Firebase Authorised Domains

- After OAuth verification, Google Sign-In was throwing `auth/unauthorized-domain`
- `revynce.com.au` and `www.revynce.com.au` were not in Firebase's allowed domains list
- Fix: Firebase Console → Authentication → Settings → Authorised Domains → Add Domain
- Added both `revynce.com.au` and `www.revynce.com.au`

---

## Phase 8 — Remove Hardcoded Template Data

New accounts were showing fake demo data instead of real Firebase data:

| Area | Problem | Fix |
|---|---|---|
| Notifications | 4 fake seeded notifications | Removed — new accounts only get "Welcome to Revynce!" |
| Dashboard Alerts | Hardcoded "Physics Chapter 3", "Mrs Clarke added Chemistry notes" | Replaced with empty state |
| Topic Strength | Hardcoded Biology 82%, Maths 74% | Now loads from `quizScores/{uid}` |
| Today's Schedule | Hardcoded Biology/Maths/Chemistry blocks | Now loads from `schedule/{uid}` for current day |
| Notices | Hardcoded Biology and Maths notices in HTML | Removed — only real notices from Firebase shown |
| Timetable | Demo fallback with fake classes | Removed — empty grid shown until user adds periods |

### Bug introduced and fixed
- Removing the demo timetable block left a stray `}` causing a JavaScript syntax error
- This crashed the entire page on load
- Fixed by removing the extra brace from `renderTimetable`

---

## Phase 9 — DNS & HTTPS Recovery

- Crazy Domains reset DNS records, pointing `revynce.com.au` back to their Sitebeat "under construction" page
- Root cause: a conflicting Sitebeat A record `103.67.235.120` was present alongside GitHub Pages A records
- Fix: deleted `103.67.235.120` from Crazy Domains, re-added custom domain in GitHub Pages to re-trigger Let's Encrypt
- DNS check went green; HTTPS re-provisioned successfully

---

## Phase 10 — Firebase Storage Rules

### storage/unauthorized Error
- File uploads were failing with `storage/unauthorized`
- Firebase Storage had no rules file — defaulted to deny all
- Created `storage.rules` with per-user access:
  - `uploads/{uid}/` — owner read/write
  - `classResources/{classCode}/` — any authenticated user can read/write
  - `profilePics/{uid}/` — owner write, authenticated read
  - Everything else — deny
- Added `"storage": { "rules": "storage.rules" }` to `firebase.json`
- Deployed via `firebase deploy --only storage`

---

## Phase 11 — AI Upload Quality Fix

### Nonsensical Questions Generated
- AI was generating questions unrelated to the uploaded document
- Root causes:
  1. `max_tokens` was too low (4096 → 16384)
  2. System prompt was too weak — AI was supplementing with outside knowledge
- Fix: increased `max_tokens` to 16384 and strengthened system prompt to restrict AI to document content only

---

## Phase 12 — Google OAuth Origin Fix

### Error 400: origin_mismatch on Drive / Classroom
- Google Drive and Classroom integrations were throwing `Error 400: origin_mismatch`
- Fix: removed invalid `http://` entries, added `https://revynce.com.au` and `https://lucky40802.github.io` to Authorised JavaScript Origins for all 3 OAuth clients (Drive, Calendar, Classroom) in Google Cloud Console

---

## Phase 13 — Cloud Function Redeployment

- Cloud Function URL changed after redeployment (v2 functions use a different URL format)
- New URL: `https://chat-gnzkphnzfa-uc.a.run.app`
- Updated `REVYNCE_CONFIG.proxyUrl` in `index.html`
- Updated `allowedOrigins` in `functions/index.js` to include `revynce.com.au`, `www.revynce.com.au`, `lucky40802.github.io`
- Redeployed via `firebase deploy --only functions`

---

## Phase 14 — Profile Settings (Name, Password, Email, Photo)

### Edit Profile Modal Expanded
- Added clickable profile picture area with camera icon overlay
- Hidden file input triggers on click; `previewProfilePic()` shows instant local preview
- File size capped at 5 MB with toast error if exceeded
- `uploadProfilePic(uid)` uploads to `profilePics/{uid}/avatar` in Firebase Storage
- `applyProfilePic(url, initials)` sets photo on sidebar avatar and profile panel avatar

### Email Change
- Added `change-email-modal` with password re-authentication and new email field
- `doChangeEmail()` reauthenticates then calls `verifyBeforeUpdateEmail()` — new address must be confirmed before it takes effect
- Saves new email to `users/{uid}/email` in Firebase

### Profile Photo on Login
- `populateApp()` now calls `applyProfilePic(profile.photoURL, initials)` if a photoURL exists
- Photo loads automatically on every login

---

## Phase 15 — Teacher Dashboard Seed Data Removal

All hardcoded fake data removed from teacher-only views:

| Section | Was | Now |
|---|---|---|
| Stats bar | 50 students, 3 classes, 12 assignments, 4 at-risk, 76% avg | Dynamic IDs, shows `—` until real data loads |
| At-Risk Students | James Miller (Physics), Lucy Park (Chemistry) | Empty state: "No at-risk students" |
| Class Overview | Alex Johnson, Sarah Chen, James Miller, Priya Lal | Empty state: "No students yet" |
| Subject Ranking | Biology Year 12, Advanced Mathematics toggles | Empty state placeholder |
| Hardest Topics | Quantum Mechanics 38%, Organic Reactions 45% | Empty state placeholder |
| Assignment Completion | Biology Test 1 96%, Maths Quiz 3 88% | Empty state placeholder |
| Marked Submissions | Alex Johnson 88%, Sarah Chen 74%, James Miller 42% | Empty state: "No submissions marked yet" |
| Attendance Records | 5 hardcoded rows (Jun 2026 dates) | Empty state: "No attendance records yet" |

---

## Phase 16 — UI / UX Polish

### Notification Badge
- Sidebar notification count badge was always visible showing `0`
- Fix: badge now hidden (`display:none`) when count is 0

### Today's Schedule Icon
- Empty-state calendar icon was grey/faded
- Fix: icon now uses `color:var(--cyan)` to match dashboard colour scheme

### Admin Role
- Added new `admin` account type for school office staff
- Admin pill added to signup role selector
- Admin accounts see an "Administration" section in sidebar with "Post Announcement" button
- Uses the existing notice system — announcements visible to all students
- `populateApp()` updated to handle `role === 'admin'`
- Google Sign-In role detection updated to detect admin pill correctly

---

## Phase 17 — Edit Mode & Custom Confirm Popup

### Custom Confirm Popup
- All `confirm()` browser dialogs replaced with a styled in-tab popup
- `showConfirm(message, onConfirm, { title, label })` — shows a card overlay with:
  - Custom title and message
  - Cancel button (dismisses popup, no action)
  - Coloured action button
  - Click outside to dismiss
- Applied to: archive entry delete, flashcard deck delete, notice delete, assignment delete, resource delete, timetable period remove, class delete

### Archive Multi-Select Edit Mode
- **Edit / Done toggle** button in top-right of every subject folder view
- In edit mode:
  - Checkboxes appear on each upload row
  - Clicking a row selects / deselects it (highlights in rose)
  - Edit bar shows selected count and enables "Delete selected" button
- **Bulk delete**: single confirm popup, all selected entries removed from Firebase in one pass, view refreshes automatically
- Edit mode resets automatically when navigating to a new folder

---

## Phase 18 — Google OAuth Verification (In Progress)

### Verification submission status
- Terms of Service page added at `https://revynce.com.au/terms.html`
- Authorised domains confirmed: `revynce.com.au`, `revynce-740d1.firebaseapp.com`, `revynce-740d1.web.app`
- Contact email: `lakshan.jagadeishan@gmail.com`

### Scopes declared
| Scope | Purpose |
|---|---|
| `../auth/calendar.events` | Sync study schedule blocks to user's Google Calendar |
| `../auth/classroom.courses.readonly` | Import enrolled courses so user doesn't re-enter school details |
| `../auth/classroom.rosters.readonly` | Import class rosters for teacher view |
| `../auth/drive.readonly` | Let user select their own study documents for AI note generation |
| `../auth/userinfo.email` | Identify the user's Google account on sign-in |

### Scope justification written
> "Revynce is an AI-powered study platform for students and teachers. Google Drive read-only is used to let users select their own study documents for AI note generation — no other Drive files are accessed. Google Classroom Read-Only is used to import the user's enrolled courses and class rosters so they don't need to re-enter school details. Google Calendar events scope is used to sync the user's personalised study schedule to their calendar. No data is stored, sold, or shared with third parties. All integrations are opt-in."

### Remaining blockers before verification can be submitted
- **Drive scope** — missing: per-scope intended data usage field, demo video link
- **Calendar scope** — missing: per-scope intended data usage field, demo video link
- **Demo video** — not yet recorded; must show each sensitive scope being used in-app

---

## Current Status

| Item | Status |
|---|---|
| Firebase security rules | Done |
| Google Sign-In | Done |
| AI JSON parse fix | Done |
| Missing HTML panels | Done |
| Organise / reorganise feature | Done |
| Custom domain (revynce.com.au) | Done |
| HTTPS / SSL | Done |
| Google Search Console | Verified |
| Google OAuth branding | Verified |
| Firebase authorised domains | Done |
| Firebase Storage rules | Done |
| Remove hardcoded demo data (student) | Done |
| Remove hardcoded demo data (teacher) | Done |
| AI upload quality fix (max_tokens + prompt) | Done |
| Cloud Function redeployment | Done |
| Google OAuth origin fix | Done |
| Profile settings (name, password, email, photo) | Done |
| Admin role | Done |
| Notification badge hide when zero | Done |
| Edit mode with multi-select delete | Done |
| Custom confirm popup | Done |
| revynce.com.au DNS | Done |
| Terms of Service page | Done |
| Google OAuth scope justification written | Done |
| Google OAuth demo video | **Pending — must record and upload** |
| Google OAuth intended data usage (per scope) | **Pending — must fill in Cloud Console** |
| Google OAuth verification submission | Pending (blocked by above) |
| OneDrive integration | Pending — needs Azure Client ID |

---

## Next Steps (for HSC Task 3 marks)

| Priority | Task | Marks at stake |
|---|---|---|
| 1 | Level 0 + Level 1 DFDs | ~8 marks (Criterion E) |
| 2 | Get 5 users to test + record feedback | ~10 marks (Criteria F + G) |
| 3 | Lighthouse / load time performance metrics | ~5 marks (Criterion H) |
| 4 | Gantt chart | ~3 marks (Criterion E) |
| 5 | Budget table | ~2 marks (Section 2.1) |
| 6 | HubSpot contact form integration | Boosts Criteria A + B + E |
| 7 | Record Google OAuth demo video | Unblocks Phase 18 |
