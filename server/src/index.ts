require("dotenv").config();

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { authMiddleware } from "./middleware/authMiddleware";

const ingestRoute = require("./routes/ingest");
const queryRoute = require("./routes/query");

const app = express();
const PORT = process.env.PORT || 5050;

// Security headers
app.use(helmet());

// CORS - configure for your app's domains in production
app.use(cors());

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check (no auth required)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected routes - require authentication
app.use("/ingest", authMiddleware, ingestRoute);
app.use("/query", authMiddleware, queryRoute);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Coach server running on http://localhost:${PORT}`);
  console.log(`🔒 Authentication enabled`);
  console.log(`🛡️ Rate limiting: 100 req/min per IP`);
});
