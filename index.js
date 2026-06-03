/**
 * Revynce — Groq AI Proxy
 * Firebase Cloud Function (2nd gen)
 *
 * Model: llama-3.3-70b-versatile
 *
 * HOW TO DEPLOY:
 * 1. firebase login
 * 2. firebase init functions  (choose revynce-740d1, JavaScript, no ESLint)
 * 3. Copy this file into functions/index.js
 * 4. cd functions && npm install
 * 5. firebase functions:secrets:set GROQ_API_KEY  (paste your key)
 * 6. firebase deploy --only functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const groqKey = defineSecret("GROQ_API_KEY");

exports.chat = onRequest(
  {
    secrets: [groqKey],
    cors: true,
    region: "us-central1",
    timeoutSeconds: 30,
    minInstances: 0,
  },
  async (req, res) => {
    const allowedOrigins = [
      "https://revynce-740d1.web.app",
      "https://revynce-740d1.firebaseapp.com",
      "http://localhost",
      "http://127.0.0.1",
      "null",
    ];
    const origin = req.headers.origin || "";
    res.set("Access-Control-Allow-Origin", allowedOrigins.includes(origin) ? origin : "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const { messages, model, max_tokens, temperature } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey.value()}`,
        },
        body: JSON.stringify({
          model: model || "llama-3.3-70b-versatile",
          messages,
          max_tokens: max_tokens || 1024,
          temperature: temperature || 0.7,
        }),
      });

      if (!groqResponse.ok) {
        const errBody = await groqResponse.json();
        console.error("Groq API error:", errBody);
        res.status(groqResponse.status).json({ error: errBody.error?.message || "Groq API error" });
        return;
      }

      const data = await groqResponse.json();
      res.status(200).json(data);
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(500).json({ error: "Internal proxy error: " + err.message });
    }
  }
);
