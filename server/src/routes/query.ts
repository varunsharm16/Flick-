const express = require("express");
const OpenAI = require("openai");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Flick, a friendly basketball shooting coach. Use factual data from the player's vector store to answer. Be brief and motivational.",
        },
        { role: "user", content: message },
      ],
      tools: [
        {
          type: "file_search",
          file_search: { vector_store_ids: [VECTOR_STORE_ID] },
        },
      ],
      tool_choice: "auto",
    });

    const reply =
      response.choices[0].message?.content ||
      "Sorry, I couldn’t find any relevant insights right now.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Query failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
