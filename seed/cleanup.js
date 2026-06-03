/**
 * Revynce — Account Data Cleanup Script
 * =======================================
 * Wipes all Realtime Database data for the specified accounts.
 * Firebase Auth accounts are kept — only app data is removed.
 *
 * SETUP (same as seed.js — skip if already done):
 *   1. Firebase Console → Project Settings → Service Accounts
 *   2. "Generate new private key" → save as  seed/serviceAccount.json
 *   3. cd seed && npm install
 *
 * RUN:
 *   node cleanup.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://revynce-740d1-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const auth = admin.auth();
const db   = admin.database();

// ── Accounts to clean ────────────────────────────────────────────────────────
const EMAILS_TO_CLEAN = [
  "lakshan.jagadeishan@education.nsw.gov.au",
  "lakshan.jagadeishan@gmail.com",
];

// All database paths that store per-user data
const USER_DB_PATHS = [
  "users",
  "flashcardDecks",
  "uploads",
  "quizScores",
  "enrollments",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getUid(email) {
  try {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  } catch (e) {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  }
}

async function cleanUser(email) {
  console.log(`\n  Cleaning: ${email}`);

  const uid = await getUid(email);
  if (!uid) {
    console.log(`    ⚠  No Firebase Auth account found — skipping.`);
    return;
  }
  console.log(`    UID: ${uid}`);

  // Remove all per-user database paths
  for (const path of USER_DB_PATHS) {
    const fullPath = `${path}/${uid}`;
    const snap = await db.ref(fullPath).once("value");
    if (snap.exists()) {
      await db.ref(fullPath).remove();
      console.log(`    ✓ Deleted  /${fullPath}`);
    } else {
      console.log(`    –  Empty    /${fullPath}`);
    }
  }

  // Also remove this user from any classMembers entries
  const classMembersSnap = await db.ref("classMembers").once("value");
  if (classMembersSnap.exists()) {
    const classes = classMembersSnap.val();
    for (const code of Object.keys(classes)) {
      if (classes[code][uid]) {
        await db.ref(`classMembers/${code}/${uid}`).remove();
        console.log(`    ✓ Removed from classMembers/${code}`);
      }
    }
  }

  console.log(`    ✅ ${email} — clean.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🧹  Revynce Account Cleanup\n" + "─".repeat(40));
  console.log("Accounts to clean:");
  EMAILS_TO_CLEAN.forEach(e => console.log(`  • ${e}`));

  for (const email of EMAILS_TO_CLEAN) {
    await cleanUser(email);
  }

  console.log("\n" + "─".repeat(40));
  console.log("✅  Cleanup complete — Auth accounts preserved, all app data removed.\n");
  process.exit(0);
}

main().catch(e => { console.error("\n✗ Cleanup failed:", e); process.exit(1); });
