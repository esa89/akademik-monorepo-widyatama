import { obeApi } from './api';

export interface WeightEntry {
  cpmkId: string;
  assessmentComponentId: string;
  weight: number;
}

export interface ScoreEntry {
  studentId: string;
  cpmkId: string;
  assessmentComponentId: string;
  score: number;
}

export const obeService = {
  getWeightsByCourse: (courseId: string) =>
    obeApi
      .get<{ data: WeightEntry[] }>('/course-cpmk-weights', { params: { courseId } })
      .then((r) => r.data),

  bulkSaveScores: (payload: { classId: string; courseId: string; scores: ScoreEntry[] }) =>
    obeApi.post('/student-cpmk-scores/bulk', payload).then((r) => r.data),
};
