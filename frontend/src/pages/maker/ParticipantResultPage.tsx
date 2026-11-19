import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { assessmentsApi } from "../../api/assessments";
import { invitationsApi } from "../../api/invitations";
import Layout from "../../components/ui/Layout";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { BAND_BADGE, BAND_COLORS } from "../../lib/bands";
import type { TraitScoreResult } from "../../types";

function ScoreBar({ score, band }: { score: number; band?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"
        role="meter"
        aria-valuenow={Math.round(score)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-2 rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${score}%`,
            background: (band && BAND_COLORS[band]) || BAND_COLORS.mid,
          }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">
        {score.toFixed(0)}
      </span>
    </div>
  );
}

export default function ParticipantResultPage() {
  const { id, invitationId } = useParams<{ id: string; invitationId: string }>();

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentsApi.get(Number(id)).then((r) => r.data),
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["participant-result", id, invitationId],
    queryFn: () =>
      invitationsApi.participantResult(Number(id), Number(invitationId)).then((r) => r.data),
  });

  return (
    <Layout
      breadcrumbs={[
        { label: "Assessments", href: "/" },
        { label: assessment?.title || "…", href: `/assessments/${id}` },
        { label: "Participants", href: `/assessments/${id}/invitations` },
        { label: result?.participant_email || "Participant" },
      ]}
    >
      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {result && (
        <div className="max-w-2xl space-y-5">
          <Link
            to={`/assessments/${id}/invitations`}
            className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={14} /> Back to participants
          </Link>

          <div className="card flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-600/15">
              {result.participant_email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-gray-900">
                {result.participant_email}
              </h2>
              {result.completed_at ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={13} className="text-gray-400" />
                  Completed {new Date(result.completed_at).toLocaleString()}
                </p>
              ) : (
                <p className="mt-0.5 text-sm capitalize text-gray-500">
                  {result.status?.replace("_", " ")}
                </p>
              )}
            </div>
          </div>

          {!result.result ? (
            <div className="card">
              <EmptyState
                compact
                icon={<Clock size={22} />}
                title="No profile yet"
                message={`This participant hasn't submitted their answers. Current status: ${result.status?.replace("_", " ")}.`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {result.result.trait_scores.map((ts: TraitScoreResult) => (
                <div key={ts.trait_id} className="card">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold tracking-tight text-gray-900">
                      {ts.trait_name}
                    </h3>
                    {ts.band_label && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          BAND_BADGE[ts.band_name ?? "mid"] ?? BAND_BADGE.mid
                        }`}
                      >
                        {ts.band_label}
                      </span>
                    )}
                  </div>

                  <ScoreBar score={ts.normalized_score} band={ts.band_name} />

                  {ts.interpretive_text && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {ts.interpretive_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
