import axios from "axios";

// Participant API uses no auth headers
const participantApi = axios.create({
  baseURL: "/api/p",
  headers: { "Content-Type": "application/json" },
});

export const participantApiService = {
  getAssessment: (token: string) => participantApi.get(`/${token}/`),

  saveAnswer: (token: string, question_id: number, answer_option_id: number) =>
    participantApi.post(`/${token}/answers/`, { question_id, answer_option_id }),

  submit: (token: string) => participantApi.post(`/${token}/submit/`),
};
