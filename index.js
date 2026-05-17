/**
 * Revynce — OpenAI Proxy
 * Firebase Cloud Function (2nd gen)
 *
 * HOW TO UPDATE & REDEPLOY:
 * 1. Store your NEW OpenAI key as a secret:
 *       firebase functions:secrets:set OPENAI_API_KEY
 *    Paste your new key when prompted.
 *
 * 2. Replace functions/index.js with this file.
 *
 * 3. Deploy:
 *       firebase deploy --only functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// References the secret stored in Google Secret Manager
const openAiKey = defineSecret("OPENAI_API_KEY");

exports.chat = onRequest(
  {
    secrets: [openAiKey],        // key injected at runtime only — never in browser
    cors: true,
    region: "us-central1",
    timeoutSeconds: 30,
    minInstances: 0,             // scales to zero when idle (free tier friendly)
  },
  async (req, res) => {

    // ── CORS — locked to your GitHub Pages domain ──
    const allowedOrigins = [
      "https://lucky40802.github.io",
      "http://localhost",
      "http://127.0.0.1",
      "null",                    // file:// during local dev
    ];

    const origin = req.headers.origin || "";
    if (allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      res.set("Access-Control-Allow-Origin", "*"); // remove this line once tested
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

    // Validate request body
    const { messages, model, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    // ── Forward to OpenAI ──
    try {
      const openAiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${openAiKey.value()}`, // key never sent to browser
          },
          body: JSON.stringify({
            model:       model       || "gpt-4o-mini", // cheap + fast + smart
            messages:    messages,
            max_tokens:  max_tokens  || 1024,
            temperature: temperature || 0.7,
          }),
        }
      );

      if (!openAiResponse.ok) {
        const errBody = await openAiResponse.json();
        console.error("OpenAI API error:", errBody);
        res.status(openAiResponse.status).json({
          error: errBody.error?.message || "OpenAI API error",
        });
        return;
      }

      const data = await openAiResponse.json();
      res.status(200).json(data);

    } catch (err) {
      console.error("Proxy fetch error:", err);
      res.status(500).json({ error: "Internal proxy error: " + err.message });
    }
  }
);
