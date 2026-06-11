/**
 * Revynce — One-time Demo Seed Script
 * =====================================
 * Creates two demo accounts + sample data in Firebase.
 *
 * SETUP (run once):
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → save as  seed/serviceAccount.json
 *   3. cd seed
 *   4. npm install
 *   5. node seed.js
 *
 * DEMO CREDENTIALS (created by this script):
 *   Teacher  →  teacher@revynce.demo  /  Teacher123!
 *   Student  →  student@revynce.demo  /  Student123!
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://revynce-740d1-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const auth = admin.auth();
const db   = admin.database();

// ── Account definitions ──────────────────────────────────────────────────────
const TEACHER = {
  email: "teacher@revynce.demo",
  password: "Teacher123!",
  displayName: "Sarah Clarke",
  profile: {
    name: "Sarah Clarke",
    email: "teacher@revynce.demo",
    role: "teacher",
    plan: "pro",
    xp: 1200,
    streak: 14,
    createdAt: new Date().toISOString(),
  },
};

const STUDENT = {
  email: "student@revynce.demo",
  password: "Student123!",
  displayName: "Alex Johnson",
  profile: {
    name: "Alex Johnson",
    email: "student@revynce.demo",
    role: "student",
    plan: "pro",
    xp: 340,
    streak: 7,
    createdAt: new Date().toISOString(),
  },
};

// ── Demo class ───────────────────────────────────────────────────────────────
const CLASS_CODE = "BIO-DEMO";
const CLASS_DATA = {
  name: "Biology Year 12",
  subject: "Biology",
  yearLevel: "Year 12",
  code: CLASS_CODE,
  createdAt: new Date().toISOString(),
};

// ── Sample flashcard decks ───────────────────────────────────────────────────
const BIOLOGY_DECK = {
  subject: "Biology",
  createdAt: new Date().toISOString(),
  cards: [
    { front: "What is photosynthesis?", back: "The process by which plants convert sunlight, water and CO₂ into glucose and oxygen using chlorophyll." },
    { front: "Define osmosis.", back: "Movement of water molecules from high to low water potential through a semi-permeable membrane." },
    { front: "What is mitosis?", back: "Cell division producing two identical daughter cells. Stages: PMAT (Prophase, Metaphase, Anaphase, Telophase)." },
    { front: "What is meiosis?", back: "Cell division that produces four genetically unique haploid cells — used in sexual reproduction." },
    { front: "Define natural selection.", back: "Organisms with favourable traits are more likely to survive and reproduce, passing on those traits." },
    { front: "What is an enzyme?", back: "A biological catalyst (protein) that speeds up chemical reactions without being consumed." },
    { front: "What is ATP?", back: "Adenosine triphosphate — the primary energy currency of the cell, produced in mitochondria." },
    { front: "Define homeostasis.", back: "The maintenance of a stable internal environment (e.g. body temperature, blood glucose) despite external changes." },
  ],
};

const CHEMISTRY_DECK = {
  subject: "Chemistry",
  createdAt: new Date().toISOString(),
  cards: [
    { front: "What is an ionic bond?", back: "Electrostatic attraction between oppositely charged ions, usually between a metal and a non-metal." },
    { front: "What is a covalent bond?", back: "A bond formed by the sharing of electrons between two non-metal atoms." },
    { front: "Avogadro's number?", back: "6.022 × 10²³ — the number of particles in one mole of a substance." },
    { front: "What is pH?", back: "A scale (0–14) measuring acidity/alkalinity. pH < 7 = acidic, pH 7 = neutral, pH > 7 = alkaline." },
    { front: "Endothermic vs exothermic?", back: "Endothermic: absorbs heat from surroundings (feels cold). Exothermic: releases heat to surroundings (feels warm)." },
    { front: "What is oxidation?", back: "Loss of electrons (OIL RIG — Oxidation Is Loss, Reduction Is Gain)." },
  ],
};

const MATHS_DECK = {
  subject: "Mathematics",
  createdAt: new Date().toISOString(),
  cards: [
    { front: "Quadratic formula?", back: "x = (−b ± √(b²−4ac)) / 2a — solves ax² + bx + c = 0." },
    { front: "Derivative of sin(x)?", back: "cos(x) — remember d/dx[sin x] = cos x, d/dx[cos x] = −sin x." },
    { front: "Equation of a circle?", back: "(x − h)² + (y − k)² = r², centred at (h, k) with radius r." },
    { front: "Product rule?", back: "If y = uv, then dy/dx = u(dv/dx) + v(du/dx)." },
    { front: "Integral of x^n?", back: "∫x^n dx = x^(n+1) / (n+1) + C, where n ≠ −1." },
  ],
};

// ── Sample quiz scores ────────────────────────────────────────────────────────
function makeQuizScores() {
  const now = Date.now();
  return {
    [now - 86400000 * 7]: { score: 4, total: 5, subject: "Biology",     date: new Date(now - 86400000 * 7).toISOString() },
    [now - 86400000 * 5]: { score: 3, total: 5, subject: "Mathematics", date: new Date(now - 86400000 * 5).toISOString() },
    [now - 86400000 * 3]: { score: 5, total: 5, subject: "Chemistry",   date: new Date(now - 86400000 * 3).toISOString() },
    [now - 86400000 * 1]: { score: 4, total: 6, subject: "History",     date: new Date(now - 86400000 * 1).toISOString() },
  };
}

// ── Sample uploads ────────────────────────────────────────────────────────────
function makeUploads() {
  const now = Date.now();
  return {
    [now - 86400000 * 6]: { fileName: "Biology_Chapter4_Notes.txt",   subject: "Biology",     uploadedAt: new Date(now - 86400000 * 6).toISOString() },
    [now - 86400000 * 4]: { fileName: "Maths_Calculus_Worksheet.txt", subject: "Mathematics", uploadedAt: new Date(now - 86400000 * 4).toISOString() },
    [now - 86400000 * 2]: { fileName: "Chemistry_Organic_Acids.txt",  subject: "Chemistry",   uploadedAt: new Date(now - 86400000 * 2).toISOString() },
  };
}

// ── Main seeder ──────────────────────────────────────────────────────────────
async function createUser(account) {
  try {
    const existing = await auth.getUserByEmail(account.email).catch(() => null);
    if (existing) {
      console.log(`  ✓ User already exists: ${account.email} (uid: ${existing.uid})`);
      return existing.uid;
    }
    const user = await auth.createUser({
      email: account.email,
      password: account.password,
      displayName: account.displayName,
      emailVerified: true,
    });
    console.log(`  ✓ Created user: ${account.email} (uid: ${user.uid})`);
    return user.uid;
  } catch (e) {
    console.error(`  ✗ Failed to create ${account.email}:`, e.message);
    throw e;
  }
}

async function main() {
  console.log("\n🌱  Revynce Demo Seed Script\n" + "─".repeat(40));

  // 1. Create accounts
  console.log("\n[1/5] Creating Firebase Auth accounts…");
  const teacherUid = await createUser(TEACHER);
  const studentUid = await createUser(STUDENT);

  // 2. Write user profiles to Realtime DB
  console.log("\n[2/5] Writing user profiles…");
  await db.ref(`users/${teacherUid}`).set({
    ...TEACHER.profile,
    uid: teacherUid,
  });
  await db.ref(`users/${studentUid}`).set({
    ...STUDENT.profile,
    uid: studentUid,
  });
  console.log("  ✓ Profiles written");

  // 3. Create demo class + enrollments
  console.log("\n[3/5] Creating demo class and enrollments…");
  await db.ref(`classes/${CLASS_CODE}`).set({
    ...CLASS_DATA,
    teacherUid,
    teacherName: TEACHER.profile.name,
  });
  // Enroll teacher
  await db.ref(`enrollments/${teacherUid}/${CLASS_CODE}`).set({
    ...CLASS_DATA,
    teacherName: TEACHER.profile.name,
    role: "teacher",
    joinedAt: new Date().toISOString(),
  });
  // Enroll student
  await db.ref(`enrollments/${studentUid}/${CLASS_CODE}`).set({
    ...CLASS_DATA,
    teacherName: TEACHER.profile.name,
    role: "student",
    joinedAt: new Date().toISOString(),
  });
  // Add student as class member
  await db.ref(`classMembers/${CLASS_CODE}/${studentUid}`).set({
    name: STUDENT.profile.name,
    joinedAt: new Date().toISOString(),
  });
  console.log(`  ✓ Class ${CLASS_CODE} created + both users enrolled`);

  // 4. Student flashcard decks
  console.log("\n[4/5] Seeding student flashcard decks…");
  const deckKey = Date.now();
  await db.ref(`flashcardDecks/${studentUid}/${deckKey}`).set(BIOLOGY_DECK);
  await db.ref(`flashcardDecks/${studentUid}/${deckKey + 1}`).set(CHEMISTRY_DECK);
  await db.ref(`flashcardDecks/${studentUid}/${deckKey + 2}`).set(MATHS_DECK);
  console.log("  ✓ 3 flashcard decks added (Biology, Chemistry, Maths)");

  // 5. Student quiz scores + uploads
  console.log("\n[5/5] Seeding quiz scores and upload history…");
  const scores = makeQuizScores();
  for (const [key, score] of Object.entries(scores)) {
    await db.ref(`quizScores/${studentUid}/${key}`).set(score);
  }
  const uploads = makeUploads();
  for (const [key, upload] of Object.entries(uploads)) {
    await db.ref(`uploads/${studentUid}/${key}`).set(upload);
  }
  console.log("  ✓ 4 quiz scores + 3 uploads seeded");

  console.log("\n" + "─".repeat(40));
  console.log("✅  Seed complete!\n");
  console.log("DEMO CREDENTIALS");
  console.log("─".repeat(40));
  console.log(`Teacher  →  ${TEACHER.email}`);
  console.log(`          Password: ${TEACHER.password}`);
  console.log(`Student  →  ${STUDENT.email}`);
  console.log(`          Password: ${STUDENT.password}`);
  console.log("─".repeat(40) + "\n");

  process.exit(0);
}

main().catch(e => { console.error("\n✗ Seed failed:", e); process.exit(1); });
