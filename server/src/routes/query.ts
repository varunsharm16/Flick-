import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

// Zod schema for query request
const QuerySchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
});

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    // Validate input
    const parseResult = QuerySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const { message } = parseResult.data;
    const userId = req.user?.id;

    console.log(`💬 Query from user ${userId}: ${message.substring(0, 50)}...`);

    // Use OpenAI Responses API with file search
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
      instructions: `You are Flick, a friendly basketball shooting coach. Use factual data from the player's vector store to answer. Be brief and motivational. The current user ID is: ${userId}`,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID!],
        },
      ],
    });

    const reply = response.output_text || "Sorry, I couldn't find any relevant insights right now.";

    res.json({ reply });
  } catch (err: any) {
    console.error("❌ Query failed:", err);
    res.status(500).json({ error: "Failed to process query" });
  }
});

module.exports = router;
