const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path"); // ✅ Missing line added

const app = express();

// Serve static files from “public” folder
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// ===== Read secrets from environment (set in Vercel dashboard) =====
const APP_PASSWORD = process.env.APP_PASSWORD;       // 16-digit app password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;   // "NSYHJTJBTS"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ===== Login API =====
app.post("/api/login", (req, res) => {
  const { password } = req.body;

  if (password === APP_PASSWORD) {
    return res.json({ success: true, role: "user" });
  } else if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, role: "admin" });
  } else {
    return res.json({ success: false });
  }
});

// ===== Generate Image =====
app.post("/api/generateImage", async (req, res) => {
  const { prompt } = req.body;

  // Safety filter
  if (/ut(a|)r|nanga|remove\s*clothes/i.test(prompt)) {
    return res.status(400).json({ error: "Disallowed prompt" });
  }

  try {
    const result = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // ---- Parsing Gemini Response ----
    let imageUrl = "";
    const candidates = result.data?.candidates;

    if (candidates && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (parts && parts.length > 0) {
        if (parts[0].text && parts[0].text.startsWith("http")) {
          imageUrl = parts[0].text;
        } else if (parts[0].inlineData?.data) {
          imageUrl = "data:image/png;base64," + parts[0].inlineData.data;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "No image returned from Gemini" });
    }

    res.json({ imageUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API error" });
  }
});

// ✅ Fix for “Cannot GET /”
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
