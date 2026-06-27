/**
 * Revynce — Groq AI Proxy
 * Firebase Cloud Function (2nd gen)
 *
 * HOW TO DEPLOY:
 * 1. cd into the folder that contains this `functions/` directory
 * 2. npm install -g firebase-tools   (if not already installed)
 * 3. firebase login
 * 4. firebase init functions         (choose your revynce-740d1 project, JavaScript, no ESLint)
 * 5. Copy this file into functions/index.js
 * 6. cd functions && npm install     (installs firebase-functions, firebase-admin)
 * 7. Store your secret key:
 *       firebase functions:secrets:set GROQ_API_KEY
 *    Paste your key when prompted: gsk_JNTSTg...
 * 8. Deploy:
 *       firebase deploy --only functions
 * 9. Copy the printed Function URL — looks like:
 *       https://chat-XXXXXXXX-uc.a.run.app
 *    Paste it into revynce.html as PROXY_URL (see comment there).
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

if (!getApps().length) initializeApp();

const FREE_DAILY_LIMIT = 50;

// This references the secret stored in Google Secret Manager via Firebase
const groqKey = defineSecret("GROQ_API_KEY");

exports.chat = onRequest(
  {
    secrets: [groqKey],          // injects secret as env var at runtime only
    cors: true,                  // auto-handles OPTIONS preflight
    region: "us-central1",       // change if you prefer a closer region
    timeoutSeconds: 30,
    minInstances: 0,             // scales to zero when idle (free tier friendly)
  },
  async (req, res) => {

    // ── CORS headers — restrict to your domain in production ──
    const allowedOrigins = [
      "https://revynce.com.au",                 // custom domain (primary)
      "https://www.revynce.com.au",
      "https://lucky40802.github.io",           // GitHub Pages fallback
      "https://revynce-740d1.web.app",
      "https://revynce-740d1.firebaseapp.com",
      "http://localhost",
      "http://127.0.0.1",
      "null",                                   // file:// in browser during dev
    ];

    const origin = req.headers.origin || "";
    if (allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      // Uncomment the line below to lock down to allowed origins only.
      // For now we allow all so you can test before deploying to your domain.
      res.set("Access-Control-Allow-Origin", "*");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // ── Rate limiting (50 req/day for free users) ──
    const uid  = req.body?.uid;
    const plan = req.body?.plan;
    if (uid && plan !== 'pro' && plan !== 'teacher') {
      const db      = getDatabase();
      const today   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const limRef  = db.ref(`rateLimits/${uid}/${today}`);
      const snap    = await limRef.once('value');
      const count   = snap.val() || 0;
      if (count >= FREE_DAILY_LIMIT) {
        res.status(429).json({ error: `Daily AI limit of ${FREE_DAILY_LIMIT} requests reached. Upgrade to Pro for unlimited access.` });
        return;
      }
      await limRef.set(count + 1);
    }

    // Validate request body
    const { messages, model, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    // ── Forward to Groq ──
    try {
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${groqKey.value()}`,  // key never sent to browser
          },
          body: JSON.stringify({
            model:       model       || "moonshotai/kimi-k2-instruct",
            messages:    messages,
            max_tokens:  max_tokens  || 1024,
            temperature: temperature || 0.7,
          }),
        }
      );

      if (!groqResponse.ok) {
        const errBody = await groqResponse.json();
        console.error("Groq API error:", errBody);
        res.status(groqResponse.status).json({
          error: errBody.error?.message || "Groq API error",
        });
        return;
      }

      const data = await groqResponse.json();
      res.status(200).json(data);

    } catch (err) {
      console.error("Proxy fetch error:", err);
      res.status(500).json({ error: "Internal proxy error: " + err.message });
    }
  }
);
