// Simple in-memory mocks so the app runs offline
const mockProgress = {
  shootingAccuracy: 0.68, deltaAccuracy: +0.05,
  formConsistency: 0.82,  deltaForm: +0.03,
  shotsTaken: 247,        deltaShots: +12,
  releaseTime: 0.42,      deltaRelease: -0.05,
  followThrough: 0.91,    deltaFollow: +0.02,
  arcAngle: 47,           arcNote: 'Optimal range',
  accuracyTrend: [
    { day: 'D1', v: 0.61 }, { day: 'D2', v: 0.64 }, { day: 'D3', v: 0.66 },
    { day: 'D4', v: 0.67 }, { day: 'D5', v: 0.68 }, { day: 'D6', v: 0.69 },
    { day: 'D7', v: 0.68 },
  ],
};

const mockDrills = [
  { id: '1', name: 'Form Shooting', category: 'Warm-up', difficulty: 'Beginner', minutes: 5, focus: 'Release timing', steps: ['1. Elbow under ball', '2. Soft wrist', '3. Hold follow-through'] },
  { id: '2', name: 'Rhythm 1-2', category: 'Rhythm', difficulty: 'Intermediate', minutes: 8, focus: 'Footwork', steps: ['1. 1-2 step', '2. Square hips', '3. Shoot'] },
];

const mockProfile = { name: 'Varun', avatarUrl: '', isPro: false, userId: 'demo' };

export const api = {
  getProgress: async (_period = '7d') => mockProgress,
  getDrills: async () => mockDrills,
  getProfile: async () => mockProfile,
  postAnalyze: async (_uri: string) => ({ jobId: 'abc123', status: 'queued' as const }),
  coach: async (_text: string) => ({ reply: 'Keep your elbow under the ball and soften your wrist on release.' }),
};
