// Simple in-memory mocks so the app runs offline
const baseProgress = {
  shootingAccuracy: 0.68,
  deltaAccuracy: +0.05,
  formConsistency: 0.82,
  deltaForm: +0.03,
  shotsTaken: 247,
  deltaShots: +12,
  releaseTime: 0.42,
  deltaRelease: -0.05,
  followThrough: 0.91,
  deltaFollow: +0.02,
  arcAngle: 47,
  arcNote: 'Optimal range',
};

const progressTrends: Record<string, { day: string; v: number }[]> = {
  '7d': [
    { day: 'D1', v: 0.61 },
    { day: 'D2', v: 0.64 },
    { day: 'D3', v: 0.66 },
    { day: 'D4', v: 0.67 },
    { day: 'D5', v: 0.68 },
    { day: 'D6', v: 0.69 },
    { day: 'D7', v: 0.7 },
  ],
  '30d': [
    { day: 'Week 1', v: 0.58 },
    { day: 'Week 2', v: 0.6 },
    { day: 'Week 3', v: 0.61 },
    { day: 'Week 4', v: 0.62 },
    { day: 'Week 5', v: 0.64 },
    { day: 'Week 6', v: 0.66 },
    { day: 'Week 7', v: 0.67 },
    { day: 'Week 8', v: 0.69 },
    { day: 'Week 9', v: 0.7 },
    { day: 'Week 10', v: 0.71 },
  ],
  '90d': [
    { day: 'W1', v: 0.54 },
    { day: 'W2', v: 0.55 },
    { day: 'W3', v: 0.56 },
    { day: 'W4', v: 0.57 },
    { day: 'W5', v: 0.58 },
    { day: 'W6', v: 0.6 },
    { day: 'W7', v: 0.61 },
    { day: 'W8', v: 0.62 },
    { day: 'W9', v: 0.63 },
    { day: 'W10', v: 0.65 },
    { day: 'W11', v: 0.66 },
    { day: 'W12', v: 0.67 },
  ],
  all: [
    { day: 'Month 1', v: 0.52 },
    { day: 'Month 2', v: 0.53 },
    { day: 'Month 3', v: 0.54 },
    { day: 'Month 4', v: 0.55 },
    { day: 'Month 5', v: 0.57 },
    { day: 'Month 6', v: 0.58 },
    { day: 'Month 7', v: 0.59 },
    { day: 'Month 8', v: 0.6 },
    { day: 'Month 9', v: 0.61 },
    { day: 'Month 10', v: 0.62 },
    { day: 'Month 11', v: 0.64 },
    { day: 'Month 12', v: 0.65 },
    { day: 'Month 13', v: 0.66 },
    { day: 'Month 14', v: 0.67 },
  ],
};

const progressAdjustments: Record<string, Partial<typeof baseProgress>> = {
  '7d': {},
  '30d': {
    shootingAccuracy: 0.7,
    deltaAccuracy: +0.04,
    formConsistency: 0.83,
    deltaForm: +0.02,
    shotsTaken: 980,
    deltaShots: +58,
    releaseTime: 0.41,
    deltaRelease: -0.06,
    followThrough: 0.92,
    deltaFollow: +0.03,
    arcAngle: 48,
  },
  '90d': {
    shootingAccuracy: 0.65,
    deltaAccuracy: +0.07,
    formConsistency: 0.8,
    deltaForm: +0.04,
    shotsTaken: 3420,
    deltaShots: +180,
    releaseTime: 0.43,
    deltaRelease: -0.05,
    followThrough: 0.9,
    deltaFollow: +0.025,
    arcAngle: 47,
  },
  all: {
    shootingAccuracy: 0.62,
    deltaAccuracy: +0.1,
    formConsistency: 0.78,
    deltaForm: +0.05,
    shotsTaken: 5120,
    deltaShots: +240,
    releaseTime: 0.45,
    deltaRelease: -0.04,
    followThrough: 0.88,
    deltaFollow: +0.02,
    arcAngle: 46,
    arcNote: 'Long-term upward arc',
  },
};

const mockDrills = [
  { id: '1', name: 'Form Shooting', category: 'Warm-up', difficulty: 'Beginner', minutes: 5, focus: 'Release timing', steps: ['1. Elbow under ball', '2. Soft wrist', '3. Hold follow-through'] },
  { id: '2', name: 'Rhythm 1-2', category: 'Rhythm', difficulty: 'Intermediate', minutes: 8, focus: 'Footwork', steps: ['1. 1-2 step', '2. Square hips', '3. Shoot'] },
];

const mockProfile = { name: 'Varun', avatarUrl: '', isPro: false, userId: 'demo' };

export const api = {
  getProgress: async (period = '7d') => {
    const key = period.toLowerCase();
    const trend = progressTrends[key] ?? progressTrends['7d'];
    const adjustments = progressAdjustments[key] ?? progressAdjustments['7d'];

    return {
      ...baseProgress,
      ...adjustments,
      accuracyTrend: trend,
    };
  },
  getDrills: async () => mockDrills,
  getProfile: async () => mockProfile,
  postAnalyze: async (_uri: string) => ({ jobId: 'abc123', status: 'queued' as const }),
  coach: async (_text: string) => ({ reply: 'Keep your elbow under the ball and soften your wrist on release.' }),
};
