import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || TEXT_MODEL;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const coachingCueSchema = z.object({
  text: z.string(),
  source: z.string().optional(),
  priority: z.number().optional(),
});

const shotSchema = z.object({
  id: z.string(),
  drillID: z.string(),
  capturedAt: z.string(),
  features: z.record(z.string(), z.any()),
  fingerprint: z.record(z.string(), z.any()),
  outcome: z.string(),
  zone: z.string(),
});

const drillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  zone: z.string(),
  shotType: z.string(),
  targetType: z.string(),
  targetCount: z.number(),
  weaknessTags: z.array(z.string()).optional(),
  difficulty: z.string(),
  coachingFocus: z.string(),
});

const shotAnalysisSchema = z.object({
  shot: shotSchema,
  keyFramesBase64JPEG: z.array(z.string()).max(5).default([]),
  drill: drillSchema,
  userProfile: z.record(z.string(), z.any()).nullable().optional(),
});

const sessionSynthesisSchema = z.object({
  session: z.record(z.string(), z.any()),
});

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.record(z.string(), z.any()).optional(),
});

const ttsSchema = z.object({
  text: z.string().min(1).max(800),
});

router.post("/shot", async (req: express.Request, res: express.Response) => {
  try {
    const parsed = shotAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid shot analysis payload", details: parsed.error.flatten() });
    }

    const { shot, drill, userProfile, keyFramesBase64JPEG } = parsed.data;
    const content: any[] = [
      {
        type: "input_text",
        text: [
          "You are Coach Flick, a technical basketball jumpshot coach.",
          "Return one short cue if useful. Do not mention unavailable model internals to the athlete unless data is insufficient.",
          `Drill: ${drill.name}, zone: ${drill.zone}, focus: ${drill.coachingFocus}.`,
          `Shot outcome: ${shot.outcome}. Features JSON: ${JSON.stringify(shot.features)}.`,
          `User profile JSON: ${JSON.stringify(userProfile || {})}.`,
        ].join("\n"),
      },
      ...keyFramesBase64JPEG.map((image) => ({
        type: "input_image",
        image_url: `data:image/jpeg;base64,${image}`,
      })),
    ];

    const response = await openai.responses.create({
      model: VISION_MODEL,
      input: [{ role: "user", content }],
    } as any);

    const text = response.output_text?.trim();
    res.json({
      cue: text ? { text, source: "cloudAnalysis", priority: 3 } : null,
      notes: text || null,
    });
  } catch (error) {
    console.error("Shot analysis failed", error);
    res.status(500).json({ error: "Failed to analyze shot" });
  }
});

router.post("/session", async (req: express.Request, res: express.Response) => {
  try {
    const parsed = sessionSynthesisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid session payload", details: parsed.error.flatten() });
    }

    const response = await openai.responses.create({
      model: TEXT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Synthesize this Flick shooting session for the athlete.",
                "Return concise JSON with summary, topInsight, and nextFocus.",
                JSON.stringify(parsed.data.session),
              ].join("\n"),
            },
          ],
        },
      ],
    } as any);

    const text = response.output_text?.trim() || "";
    let payload = {
      summary: text || "Session synthesis is unavailable.",
      topInsight: "Keep collecting clean shot features.",
      nextFocus: "Complete another calibrated drill.",
    };

    try {
      payload = { ...payload, ...JSON.parse(text) };
    } catch {
      // Keep text fallback when the model returns prose.
    }

    res.json(payload);
  } catch (error) {
    console.error("Session synthesis failed", error);
    res.status(500).json({ error: "Failed to synthesize session" });
  }
});

router.post("/chat", async (req: express.Request, res: express.Response) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid chat payload", details: parsed.error.flatten() });
    }

    const response = await openai.responses.create({
      model: TEXT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You are Coach Flick. Be technical, encouraging, concise, and anchored to the athlete's data.",
                `User ID: ${req.user?.id || "unknown"}`,
                `Context JSON: ${JSON.stringify(parsed.data.context || {})}`,
                `Question: ${parsed.data.message}`,
              ].join("\n"),
            },
          ],
        },
      ],
    } as any);

    res.json({ reply: response.output_text || "I need a little more session data before I can answer that cleanly." });
  } catch (error) {
    console.error("Coach chat failed", error);
    res.status(500).json({ error: "Failed to process coach chat" });
  }
});

router.post("/tts", async (req: express.Request, res: express.Response) => {
  try {
    const parsed = ttsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid TTS payload", details: parsed.error.flatten() });
    }

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      return res.status(501).json({ error: "ElevenLabs is not configured" });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({ error: message });
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (error) {
    console.error("TTS failed", error);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

module.exports = router;
