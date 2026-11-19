import api from "./client";
import type { Assessment, Question, QuestionInput, AIGenerationJob } from "../types";

export const assessmentsApi = {
  list: () => api.get<Assessment[]>("/assessments/"),

  get: (id: number) => api.get<Assessment>(`/assessments/${id}/`),

  create: (data: Partial<Assessment>) => api.post<Assessment>("/assessments/", data),

  update: (id: number, data: Partial<Assessment>) =>
    api.patch<Assessment>(`/assessments/${id}/`, data),

  delete: (id: number) => api.delete(`/assessments/${id}/`),

  publish: (id: number) => api.post<Assessment>(`/assessments/${id}/publish/`),

  // Questions
  getQuestions: (id: number) => api.get<Question[]>(`/assessments/${id}/questions/`),

  createQuestion: (id: number, data: QuestionInput) =>
    api.post<Question>(`/assessments/${id}/questions/`, data),

  updateQuestion: (id: number, qid: number, data: QuestionInput) =>
    api.put<Question>(`/assessments/${id}/questions/${qid}/`, data),

  deleteQuestion: (id: number, qid: number) =>
    api.delete(`/assessments/${id}/questions/${qid}/`),

  reorderQuestions: (id: number, order: Record<number, number>) =>
    api.post<Question[]>(`/assessments/${id}/questions/reorder/`, { order }),

  // AI Generation
  aiGenerate: (id: number, prompt: string, question_count?: number) =>
    api.post<AIGenerationJob>(`/assessments/${id}/ai-generate/`, { prompt, question_count }),

  aiJobStatus: (id: number, jobId: number) =>
    api.get<AIGenerationJob>(`/assessments/${id}/ai-generate/${jobId}/`),

  aiAcceptQuestions: (id: number, jobId: number, staged_ids?: number[]) =>
    api.post<Question[]>(`/assessments/${id}/ai-generate/${jobId}/accept/`, { staged_ids }),

  aiRegenerateQuestion: (id: number, jobId: number, stagedId: number) =>
    api.post(`/assessments/${id}/ai-generate/${jobId}/questions/${stagedId}/regenerate/`),
};
