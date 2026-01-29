const express = require("express");
const fs = require("fs");
const OpenAI = require("openai");
const path = require("path");
const { serializeSession } = require("../lib/serialize");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

router.post("/", async (req, res) => {
  try {
    const session = req.body;

    // Convert session to markdown text
    const markdown = serializeSession(session);

    // Write markdown to a temporary file
    const filepath = path.join(__dirname, `session-${session.id || Date.now()}.md`);
    fs.writeFileSync(filepath, markdown);

    // Upload markdown to vector store
    const uploadResponse = await openai.vectorStores.fileBatches.uploadAndPoll(
      VECTOR_STORE_ID,
      [fs.createReadStream(filepath)]
    );

    console.log("✅ Uploaded session file to vector store");

    // Cleanup temp file
    fs.unlinkSync(filepath);

    res.json({
      ok: true,
      message: `Session ${session.id || "unknown"} uploaded successfully`,
      uploadResponse,
    });
  } catch (err: any) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
