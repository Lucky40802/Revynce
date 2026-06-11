const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://revynce-740d1-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

const auth = admin.auth();
const db   = admin.database();

const EXTRA_STUDENTS = [
  {
    email: "student2@revynce.demo",
    password: "Student123!",
    displayName: "Mia Patel",
    profile: { name: "Mia Patel", email: "student2@revynce.demo", role: "student", plan: "pro", xp: 520, streak: 12, createdAt: new Date().toISOString() },
  },
  {
    email: "student3@revynce.demo",
    password: "Student123!",
    displayName: "Ethan Wu",
    profile: { name: "Ethan Wu", email: "student3@revynce.demo", role: "student", plan: "pro", xp: 180, streak: 3, createdAt: new Date().toISOString() },
  },
];

(async () => {
  for (const s of EXTRA_STUDENTS) {
    let uid;
    try {
      const u = await auth.createUser({ email: s.email, password: s.password, displayName: s.displayName });
      uid = u.uid;
      console.log(`✓ Created ${s.email} (${uid})`);
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        const u = await auth.getUserByEmail(s.email);
        uid = u.uid;
        console.log(`✓ Already exists ${s.email} (${uid})`);
      } else throw e;
    }
    await db.ref(`users/${uid}`).set(s.profile);
    await db.ref(`enrollments/${uid}/BIO-DEMO`).set({ name: "Biology Year 12", subject: "Biology", yearLevel: "Year 12", code: "BIO-DEMO", role: "student", joinedAt: new Date().toISOString() });
    await db.ref(`classMembers/BIO-DEMO/${uid}`).set({ name: s.profile.name, joinedAt: new Date().toISOString() });
    console.log(`  ✓ Profile + BIO-DEMO enrolment written`);
  }
  console.log("\n✅ Done!\n");
  console.log("student2@revynce.demo / Student123!");
  console.log("student3@revynce.demo / Student123!");
  process.exit(0);
})();
