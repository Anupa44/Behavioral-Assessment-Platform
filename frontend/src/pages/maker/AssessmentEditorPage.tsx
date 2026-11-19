import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentsApi } from "../../api/assessments";
import Layout from "../../components/ui/Layout";
import AssessmentTabs from "../../components/ui/AssessmentTabs";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";

export default function AssessmentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentsApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const [title, setTitle] = useState(assessment?.title || "");
  const [description, setDescription] = useState(assessment?.description || "");
  const [resultEmail, setResultEmail] = useState(assessment?.result_email_enabled || false);
  const [expiryDays, setExpiryDays] = useState(assessment?.link_expiry_days || 7);
  const [timeLimit, setTimeLimit] = useState(assessment?.time_limit_minutes || "");

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => assessmentsApi.update(Number(id), {
      title: title || assessment?.title,
      description: description || assessment?.description,
      result_email_enabled: resultEmail,
      link_expiry_days: expiryDays,
      time_limit_minutes: timeLimit ? Number(timeLimit) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: any) => setError(e.response?.data?.detail || "Save failed."),
  });

  const { mutate: publish, isPending: isPublishing } = useMutation({
    mutationFn: () => assessmentsApi.publish(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", id] });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (e: any) => setError(e.response?.data?.error || "Publish failed."),
  });

  if (isLoading) return <Layout><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>;
  if (!assessment) return <Layout><ErrorMessage message="Assessment not found." /></Layout>;

  return (
    <Layout
      title="Settings"
      subtitle={assessment.title}
      breadcrumbs={[
        { label: "Assessments", href: "/" },
        { label: assessment.title },
      ]}
    >
      <AssessmentTabs assessmentId={id!} />

      <div className="max-w-2xl space-y-5">
        {error && <ErrorMessage message={error} />}

        <div className="card space-y-5">
          <div>
            <h3 className="section-title">Details</h3>
            <p className="page-subtitle">Participants see the title and description.</p>
          </div>

          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title"
              className="input"
              value={title || assessment.title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              className="input resize-y"
              rows={3}
              value={description !== "" ? description : assessment.description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown on the first question screen"
            />
          </div>
        </div>

        <div className="card space-y-5">
          <div>
            <h3 className="section-title">Delivery</h3>
            <p className="page-subtitle">How invitation links behave for participants.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expiry" className="label">Link expiry</label>
              <div className="relative">
                <input
                  id="expiry"
                  type="number"
                  min={1}
                  max={90}
                  className="input pr-14"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  days
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="timelimit" className="label">Time limit</label>
              <div className="relative">
                <input
                  id="timelimit"
                  type="number"
                  min={1}
                  className="input pr-14"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="No limit"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  min
                </span>
              </div>
            </div>
          </div>

          <label
            htmlFor="result-email"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
          >
            <input
              id="result-email"
              type="checkbox"
              checked={resultEmail}
              onChange={(e) => setResultEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-600/40"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900">
                Email results to participants
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Sends each person their behavioral profile once they submit.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => save()} disabled={isPending} className="btn-primary">
            {saved ? "Saved" : isPending ? "Saving…" : "Save changes"}
          </button>

          {assessment.status === "draft" ? (
            <button
              onClick={() => publish()}
              disabled={isPublishing || assessment.question_count === 0}
              className="btn-secondary"
              title={
                assessment.question_count === 0
                  ? "Add at least one question first"
                  : undefined
              }
            >
              {isPublishing ? "Publishing…" : "Publish"}
            </button>
          ) : (
            <span className="badge-green">Published</span>
          )}

          {assessment.status === "draft" && assessment.question_count === 0 && (
            <p className="text-xs text-gray-500">Add a question before publishing.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
