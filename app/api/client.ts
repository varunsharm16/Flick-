import { mocks } from './mocks';

export const api = {
  getProgress: () => mocks.getProgress(),
  postAnalyze: (fileUri: string) => {
    // TODO: Replace /api/analyze to upload video to backend (FastAPI) → OpenPose → summary JSON of angles/timings.
    void fileUri;
    return mocks.postAnalyze();
  },
  postCoach: (payload: { text: string; userId: string }) => {
    // TODO: Replace /api/coach with OpenAI/Nemotron response (prompt includes summary of OpenPose keypoints).
    return mocks.postCoach(payload.text);
  },
  getDrills: () => mocks.getDrills(),
  getProfile: () => mocks.getProfile()
};
