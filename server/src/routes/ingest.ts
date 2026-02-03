import express from "express";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { z } from "zod";
import { serializeSession } from "../lib/serialize";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

// Zod schema for session data
const SessionSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  duration_seconds: z.number().optional(),
  shots_count: z.number().optional(),
  accuracy: z.number().min(0).max(100).optional(),
  form_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  // Allow additional pose/metrics data
}).passthrough();

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    // Validate input
    const parseResult = SessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid session data",
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const session = parseResult.data;
    const userId = req.user?.id;

    console.log(`📥 Ingesting session for user: ${userId}`);

    // Convert session to markdown text (include user context)
    const markdown = serializeSession({ ...session, user_id: userId });

    // Write markdown to a temporary file
    const filename = `session-${userId}-${session.id || Date.now()}.md`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, markdown);

    // Upload markdown to vector store
    const uploadResponse = await openai.vectorStores.fileBatches.uploadAndPoll(
      VECTOR_STORE_ID!,
      { files: [fs.createReadStream(filepath)] }
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
    res.status(500).json({ error: "Failed to ingest session" });
  }
});

module.exports = router;
