import { Platform } from 'react-native';

type ProgressResponse = {
  shootingAccuracy: number;
  deltaAccuracy: number;
  formConsistency: number;
  deltaForm: number;
  shotsTaken: number;
  deltaShots: number;
  releaseTime: number;
  deltaRelease: number;
  followThrough: number;
  deltaFollow: number;
  arcAngle: number;
  arcNote: string;
  accuracyTrend: { day: string; v: number }[];
};

type AnalyzeResponse = {
  jobId: string;
  status: 'queued';
};

type CoachResponse = {
  reply: string;
};

type Drill = {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  minutes: number;
  focus: string;
  steps: string[];
};

type ProfileResponse = {
  name: string;
  avatarUrl: string;
  isPro: boolean;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mocks = {
  async getProgress(): Promise<ProgressResponse> {
    await delay(400);
    return {
      shootingAccuracy: 0.68,
      deltaAccuracy: 0.05,
      formConsistency: 0.82,
      deltaForm: 0.03,
      shotsTaken: 247,
      deltaShots: 12,
      releaseTime: 0.42,
      deltaRelease: -0.05,
      followThrough: 0.91,
      deltaFollow: 0.02,
      arcAngle: 47,
      arcNote: 'Optimal range',
      accuracyTrend: [
        { day: 'D1', v: 0.61 },
        { day: 'D2', v: 0.64 },
        { day: 'D3', v: 0.67 },
        { day: 'D4', v: 0.65 },
        { day: 'D5', v: 0.69 },
        { day: 'D6', v: 0.7 },
        { day: 'D7', v: 0.68 }
      ]
    };
  },

  async postAnalyze(): Promise<AnalyzeResponse> {
    await delay(500);
    return {
      jobId: 'abc123',
      status: 'queued'
    };
  },

  async postCoach(text: string): Promise<CoachResponse> {
    await delay(500);
    const offline = typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine;
    if (offline || Platform.OS === 'web') {
      return {
        reply: 'Looks like you are offline. Focus on a smooth follow-through and revisit fundamentals.'
      };
    }
    return {
      reply: text.length
        ? 'Keep your elbow under the ball and soften your wrist on release.'
        : 'Visualize the shot first, then commit to a confident release.'
    };
  },

  async getDrills(): Promise<Drill[]> {
    await delay(350);
    return [
      {
        id: 'warmup-1',
        name: 'Form Shooting',
        category: 'Warm-up',
        difficulty: 'Beginner',
        minutes: 5,
        focus: 'Feet alignment',
        steps: [
          'Start 3 feet from the basket.',
          'Square your shoulders and focus on balance.',
          'Shoot 25 one-handed form shots.'
        ]
      },
      {
        id: 'warmup-2',
        name: 'One-Dribble Pull-ups',
        category: 'Rhythm',
        difficulty: 'Intermediate',
        minutes: 8,
        focus: 'Timing and rhythm',
        steps: [
          'Alternate dominant and off-hand dribbles.',
          'Explode into your shot after the plant foot.',
          'Make 20 shots from elbows and wings.'
        ]
      },
      {
        id: 'form-1',
        name: 'Wall Shooting Mechanics',
        category: 'Form',
        difficulty: 'Beginner',
        minutes: 6,
        focus: 'Release timing',
        steps: [
          'Stand 4 feet from a wall.',
          'Shoot without a ball, snapping your wrist.',
          'Repeat for 3 sets of 15 reps.'
        ]
      },
      {
        id: 'advanced-1',
        name: 'Quick Release Challenge',
        category: 'Advanced',
        difficulty: 'Advanced',
        minutes: 10,
        focus: 'Release speed',
        steps: [
          'Catch and shoot from five spots.',
          'Hold follow-through for 1 second.',
          'Aim for 5 makes in a row before rotating.'
        ]
      }
    ];
  },

  async getProfile(): Promise<ProfileResponse> {
    await delay(200);
    return {
      name: 'Jordan Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=200&q=80',
      isPro: false
    };
  }
};

export type { ProgressResponse, AnalyzeResponse, CoachResponse, Drill, ProfileResponse };
