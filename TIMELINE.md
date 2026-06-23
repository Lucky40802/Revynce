# Revynce - Project Timeline

## Phase 1 - Security & Authentication

### Firebase Security Rules
- Firebase database was running in Test Mode, meaning rules would expire and anyone could read/write
- Added explicit root-level deny (`".read": false, ".write": false`) to `database.rules.json`
- Deployed rules permanently via `firebase deploy --only database` so Test Mode timer is irrelevant
- Rules now enforce per-user access across all data paths

### SR-1: Google Sign-In (Missing Feature Fix)
- Google Sign-In was listed as a system requirement but was not implemented
- Added `GoogleAuthProvider` and `signInWithPopup` to Firebase auth imports
- Added "Sign in with Google" button to the login/signup card with Google SVG logo
- Added `doGoogleAuth()` function to handle the popup flow
- Requires Google to be enabled as a sign-in provider in Firebase Console

---

## Phase 2 - Bug Fixes

### AI Upload JSON Parse Error
- AI-generated content was crashing due to malformed JSON responses from the Groq API
- Implemented a three-tier fallback parser:
  1. Strip markdown code fences and parse normally
  2. Repair unescaped newlines and special characters
  3. Field-by-field regex extraction as last resort
- Covers all known AI response format variations

### Missing HTML Panels
- Flashcard and Quiz features had complete JavaScript and CSS but no HTML panels
- Both features were silently failing because `document.getElementById()` returned null
- Added `panel-flashcards` with `deck-grid` element
- Added `panel-quiz` with all 7 required IDs: `quiz-score-header`, `quiz-q`, `quiz-prog`, `quiz-progress-fill`, `quiz-next`, `quiz-fb`, `quiz-opts`

### Null Crash Guards
- `appendChat` was crashing when chat box element was missing - added `if (!box) return`
- `useSuggestion` was crashing on null `chatInput` - added null check before `.value`
- `loadFlashcards` had a race condition using raw Firebase module imports before the DB was ready - switched to `window._fbGet` / `window._fbRef` / `window._db` compatibility shim

---

## Phase 3 - Organise / Reorganise Feature

Added drag-and-drop reorganisation across 4 areas:

### Flashcard Decks
- Deck cards are now draggable with HTML5 drag-and-drop API
- Custom order saved to `flashcardDecks/{uid}/_order` in Firebase
- Added rename button and `deck-rename-modal`
- `_deckOrder` array persists across sessions

### Archive Uploads
- Each upload row now has an edit button
- Added `ar-edit-modal` to rename or delete archive entries
- `arOpenEditModal`, `arSaveEdit`, `arDeleteEntry` functions added

### Study Schedule
- Added custom study block system with `_schedBlocks` stored at `schedule/{uid}`
- Each day column has an "+ Add study block" button
- `sched-block-modal` for creating/editing blocks with subject, time, duration, notes
- `openSchedBlockModal`, `saveSchedBlock`, `deleteSchedBlock` functions

### Timetable Periods
- Teacher cells are now editable via `edit-period-modal`
- `openEditPeriodModal`, `saveEditPeriod`, `deletePeriod` functions
- Uses `window._fbGet/_fbRef/_db` with readiness guard

---

## Phase 4 - Custom Domain Setup

### GitHub Pages - revynce.com.au
- Created `CNAME` file in repo root with content `revynce.com.au`
- Configured Crazy Domains DNS:
  - 4 x A records for `@` pointing to GitHub Pages IPs:
    - 185.199.108.153
    - 185.199.109.153
    - 185.199.110.153
    - 185.199.111.153
  - CNAME for `www` pointing to `lucky40802.github.io`
- Fixed error: `www` was initially set as an A record (InvalidARecordError) - changed to CNAME
- DNS check went green in GitHub Pages settings

### HTTPS / SSL
- "Enforce HTTPS" was unavailable even after DNS check passed
- Fix: Removed and re-added the custom domain in GitHub Pages settings to trigger Let's Encrypt re-provisioning
- SSL certificate provisioned successfully - HTTPS now active on revynce.com.au

---

## Phase 5 - Google Search Console Verification

- Needed to verify domain ownership for Google Search Console
- Crazy Domains plan blocked adding extra TXT records
- Switched to HTML meta tag verification method
- Added to `<head>`:
  ```html
  <meta name="google-site-verification" content="IwwpJkYjTv5vC158KNGJg2V5JxUIM1AvhHOLhYzccQM">
  ```
- Used URL Prefix property type in Search Console (not Domain property)
- Ownership auto-verified via HTML tag

---

## Phase 6 - Google OAuth Branding Verification

### Issue: "Homepage does not explain purpose of app"
Google's branding checker kept failing with this error across multiple attempts.

**Attempt 1** - Added description paragraph in hero section under H1
- Described app functionality and listed Google integrations inline
- Still failed

**Attempt 2** - Added dedicated `#google-data-usage` section
- Cards for Classroom, Drive, Calendar with "What we access" and "Why"
- Still failed - suspected HTTPS not yet active so Google's crawler couldn't reach the page

**Attempt 3** - Added static HTML block at very top of `<body>` before any JS
- Pure HTML with no JS dependencies, visible to any crawler
- User didn't like the appearance - reverted

**Root cause identified** - Google's crawler was hitting HTTP (not HTTPS) and getting an unresponsive page. Fixed HTTPS first (Phase 4), then resubmitted.

**Final fix** - Clean homepage with:
- Removed text from under hero title (cleaner look)
- Replaced em dashes with regular dashes throughout
- Dedicated "About Revynce" section with full app description
- 4-card Google integrations section: Sign-In, Classroom, Drive, Calendar
- Each card has explicit "What we access" and "Why" text
- Privacy Policy link visible at bottom of section

**Result - Google OAuth branding VERIFIED**

---

## Phase 7 - Firebase Authorised Domains

- After OAuth verification, Google Sign-In was throwing `auth/unauthorized-domain`
- `revynce.com.au` and `www.revynce.com.au` were not in Firebase's allowed domains list
- Fix: Firebase Console > Authentication > Settings > Authorised Domains > Add Domain
- Added both `revynce.com.au` and `www.revynce.com.au`

---

## Phase 8 - Remove Hardcoded Template Data

New accounts were showing fake demo data instead of real user data from Firebase:

| Area | Problem | Fix |
|---|---|---|
| Notifications | 4 fake seeded notifications (Calculus assignment, Biology test, Leaderboard, Badge) | Removed - new accounts only get "Welcome to Revynce!" |
| Dashboard Alerts | Hardcoded "Physics Chapter 3", "Mrs Clarke added Chemistry notes" | Replaced with empty state, dynamic loading wired in |
| Topic Strength | Hardcoded Biology 82%, Maths 74%, etc. | Now loads from `quizScores/{uid}`, shows empty state if no quizzes done |
| Today's Schedule | Hardcoded Biology/Maths/Chemistry blocks | Now loads from `schedule/{uid}` for current day |
| Notices | Hardcoded Biology and Maths notices in HTML | Removed - only real notices from Firebase shown |
| Timetable | Demo fallback with fake classes (Mrs Clarke, Mr Peterson) | Removed - empty grid shown until user adds their own periods |

### Bug introduced and fixed
- Removing the demo timetable block left a stray `}` which caused a JavaScript syntax error
- This crashed the entire page on load - site went down
- Fixed by removing the extra brace from `renderTimetable` function

---

## Phase 9 - DNS & HTTPS Recovery

- Crazy Domains reset DNS records, pointing `revynce.com.au` back to their Sitebeat "under construction" page
- Root cause: a conflicting Sitebeat A record `103.67.235.120` was present alongside the GitHub Pages A records
- Fix: deleted `103.67.235.120` from Crazy Domains, re-added custom domain in GitHub Pages to re-trigger Let's Encrypt
- DNS check went green; HTTPS re-provisioned successfully

---

## Phase 10 - Firebase Storage Rules

### storage/unauthorized Error
- File uploads were failing with `storage/unauthorized` when users tried to access their own uploads
- Firebase Storage had no rules file — defaulted to deny all
- Created `storage.rules` with per-user access:
  - `uploads/{uid}/` — owner read/write
  - `classResources/{classCode}/` — any authenticated user can read, write
  - `profilePics/{uid}/` — owner write, authenticated read
  - Everything else — deny
- Added `"storage": { "rules": "storage.rules" }` to `firebase.json`
- Deployed via `firebase deploy --only storage`

---

## Phase 11 - AI Upload Fixes

### Nonsensical Questions Generated
- AI was generating questions unrelated to the uploaded document (general knowledge, science facts)
- Two root causes identified:
  1. `max_tokens` was too low (4096 → 8192 → 16384) — AI was truncating mid-generation and padding with generic content
  2. System prompt was too weak — AI was supplementing with outside knowledge
- Fix: increased `max_tokens` to 16384 and strengthened system prompt:
  > "You are Revynce AI, an educational content generator. You MUST base ALL content strictly and exclusively on the provided study material — do not add facts, questions, or concepts from outside the document."

---

## Phase 12 - Google OAuth Origin Fix

### Error 400: origin_mismatch on Drive / Classroom
- Google Drive and Classroom integrations were throwing `Error 400: origin_mismatch`
- Cause: Google OAuth clients only allow HTTPS origins in production verification mode
- Fix: Removed invalid `http://revynce.com.au` entry, added `https://revynce.com.au` and `https://lucky40802.github.io` to Authorised JavaScript Origins for all 3 OAuth clients (Drive, Calendar, Classroom) in Google Cloud Console

---

## Phase 13 - Cloud Function Redeployment

- Cloud Function URL changed after redeployment (v2 functions use a different URL format)
- Old URL: `https://chat-XXXX-cloudfunctions.net/chat`
- New URL: `https://chat-gnzkphnzfa-uc.a.run.app`
- Updated `REVYNCE_CONFIG.proxyUrl` in `index.html`
- Updated `allowedOrigins` in `functions/index.js` to include `revynce.com.au`, `www.revynce.com.au`, `lucky40802.github.io`
- Redeployed function via `firebase deploy --only functions`

---

## Phase 14 - Profile Settings (Name, Password, Email, Photo)

### Edit Profile Modal Expanded
- Added clickable profile picture area with camera icon overlay
- Hidden file input triggers on click; `previewProfilePic()` shows instant local preview
- File size capped at 5 MB with toast error if exceeded
- `uploadProfilePic(uid)` uploads to `profilePics/{uid}/avatar` in Firebase Storage, returns download URL
- `applyProfilePic(url, initials)` sets photo on sidebar avatar and profile panel avatar

### Email Change
- Added `change-email-modal` with password re-authentication and new email field
- `doChangeEmail()` reauthenticates with `EmailAuthProvider.credential`, then calls `verifyBeforeUpdateEmail()` so the new address must be confirmed before it takes effect
- Saves new email to `users/{uid}/email` in Firebase on success

### Password Change
- Existing `change-pw-modal` wired up to `openChangePasswordModal()`

### Profile Photo on Login
- `populateApp()` now calls `applyProfilePic(profile.photoURL, initials)` if a photoURL exists in Firebase
- Photo loads automatically on every login

---

## Phase 15 - Teacher Dashboard Seed Data Removal

All hardcoded fake data removed from teacher-only views:

| Section | Was | Now |
|---|---|---|
| Stats bar | 50 students, 3 classes, 12 assignments, 4 at-risk, 76% avg | Dynamic IDs, shows `—` until real data loads |
| At-Risk Students | James Miller (Physics), Lucy Park (Chemistry) | Empty state: "No at-risk students" |
| Class Overview | Alex Johnson, Sarah Chen, James Miller, Priya Lal | Empty state: "No students yet" |
| Subject Ranking | Biology Year 12, Advanced Mathematics toggles | Empty state: "Your classes will appear here" |
| Hardest Topics | Quantum Mechanics 38%, Organic Reactions 45%, etc. | Empty state placeholder |
| Assignment Completion | Biology Test 1 96%, Maths Quiz 3 88%, etc. | Empty state placeholder |
| Marked Submissions | Alex Johnson 88%, Sarah Chen 74%, James Miller 42% | Empty state: "No submissions marked yet" |
| Attendance Records | 5 hardcoded rows (Jun 2026 dates) | Empty state: "No attendance records yet" |
| Attendance by Subject | Biology 95%, Maths 92%, Physics 78%, Chemistry 85% | Empty state placeholder |

---

## Phase 16 - UI / UX Polish

### Notification Badge
- Sidebar notification count badge was always visible showing `0` when no unread notifications
- Fix: badge now hidden (`display:none`) when count is 0, shown only when there are unread notifications

### Today's Schedule Icon
- Empty-state calendar icon was grey/faded (opacity 0.3, no colour)
- Fix: icon now uses `color:var(--cyan)` to match the rest of the dashboard's colour scheme

### Admin Role
- Added new `admin` account type for school office staff
- Admin pill added to signup role selector
- Admin accounts see an "Administration" section in the sidebar with a "Post Announcement" button
- Uses the existing notice system — announcements visible to all students
- `populateApp()` updated to handle `role === 'admin'`
- Google Sign-In role detection updated to detect admin pill correctly

---

## Phase 17 - Edit Mode & Custom Confirm Popup

### Custom Confirm Popup
- All `confirm()` browser dialogs replaced with a styled in-tab popup
- `showConfirm(message, onConfirm, { title, label })` — shows a small card overlay with:
  - Custom title and message
  - Cancel button (dismisses popup, no action)
  - Coloured action button (label defaults to "Delete")
  - Click outside to dismiss
- `closeConfirm()` clears the callback and closes the popup
- Applied to: archive entry delete, flashcard deck delete, notice delete, assignment delete, resource delete, timetable period remove, class delete

### Archive Multi-Select Edit Mode
- **Edit / Done toggle** button in the top-right of every subject folder view
- In edit mode:
  - Checkboxes appear on each upload row
  - Clicking a row selects / deselects it (row highlights in rose)
  - Edit bar shows selected count and enables "Delete selected" button
- **Bulk delete**: single confirm popup, all selected entries removed from Firebase in one pass, view refreshes automatically
- Edit mode resets automatically when navigating to a new folder

---

---

## Phase 18 - Google OAuth Verification (In Progress)

### Verification submission status
- App Terms of Service page: `https://revynce.com.au/terms.html` — added and submitted
- Authorised domains confirmed: `revynce.com.au`, `revynce-740d1.firebaseapp.com`, `revynce-740d1.web.app`
- Contact email: `lakshan.jagadeishan@gmail.com`
- Scopes declared:
  - `../auth/calendar.events` — View and edit events on all calendars
  - `../auth/classroom.courses.readonly` — View Google Classroom classes
  - `../auth/classroom.rosters.readonly` — View Google Classroom class rosters
  - `../auth/drive.readonly` — See and download all Google Drive files
  - `../auth/userinfo.email` — See primary Google Account email address

### Scope justification written
> "Revynce is an AI-powered study platform for students and teachers. Google Drive read-only is used to let users select their own study documents for AI note generation — no other Drive files are accessed. Google Classroom Read-Only is used to import the user's enrolled courses and class rosters so they don't need to re-enter school details. Google Calendar events scope is used to sync the user's personalised study schedule to their calendar. No data is stored, sold, or shared with third parties. All integrations are opt-in."

### Remaining blockers before verification can be submitted
- **Drive scope** — missing: scope justification per-scope field, intended data usage, demo video link
- **Calendar scope** — missing: scope justification per-scope field, intended data usage, demo video link
- **Demo video** — not yet recorded or uploaded; must show each sensitive scope being used in the app

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
| OneDrive integration | Pending - needs Azure Client ID |
