export type SessionMetrics = {
  accuracyPct: number;        // 0..1
  releaseTimeSec: number;     // seconds
  elbowAngleDegAvg: number;   // degrees
  elbowAngleDegStd: number;   // degrees
  followThroughPct: number;   // 0..1
  arcAngleDeg: number;        // degrees
};

export type SessionSummary = {
  sessionId: string;          // UUID or timestamp string
  userId: string;
  capturedAt: string;         // ISO date
  notes: string;              // short English summary (2–4 sentences)
  metrics: SessionMetrics;
  tags: string[];             // e.g. ["elbow","release","arc"]
};
