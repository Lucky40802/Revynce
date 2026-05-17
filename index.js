/**
 * Revynce — Groq AI Proxy
 * Firebase Cloud Function (2nd gen)
 *
 * HOW TO REDEPLOY:
 * 1. firebase functions:secrets:set GROQ_API_KEY
 *    (paste your Groq key when prompted)
 * 2. firebase deploy --only functions
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
      "https://lucky40802.github.io",
      "http://localhost",
      "http://127.0.0.1",
      "null",
    ];

    const origin = req.headers.origin || "";
    if (allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { messages, model, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    try {
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${groqKey.value()}`,
          },
          body: JSON.stringify({
            model:       model       || "llama3-70b-8192",
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
