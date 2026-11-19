import api from "./client";
import type { InvitationBatch, Invitation, CohortAnalytics, ParticipantResult } from "../types";

export const invitationsApi = {
  listBatches: (assessmentId: number) =>
    api.get<InvitationBatch[]>(`/assessments/${assessmentId}/batches/`),

  createBatch: (assessmentId: number, emails: string[]) =>
    api.post<InvitationBatch>(`/assessments/${assessmentId}/batches/`, { emails }),

  listParticipants: (assessmentId: number, status?: string) =>
    api.get<Invitation[]>(`/assessments/${assessmentId}/participants/`, {
      params: status ? { status } : undefined,
    }),

  resend: (assessmentId: number, invitationId: number) =>
    api.post(`/assessments/${assessmentId}/participants/${invitationId}/resend/`),

  reissue: (assessmentId: number, invitationId: number) =>
    api.post(`/assessments/${assessmentId}/participants/${invitationId}/reissue/`),

  // Dashboard
  cohortAnalytics: (assessmentId: number, versionId?: number) =>
    api.get<CohortAnalytics>(`/assessments/${assessmentId}/analytics/`, {
      params: versionId ? { version: versionId } : undefined,
    }),

  participantResult: (assessmentId: number, invitationId: number) =>
    api.get<ParticipantResult>(`/assessments/${assessmentId}/participants/${invitationId}/result/`),
};
