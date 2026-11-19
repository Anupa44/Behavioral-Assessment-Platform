import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart2, ListChecks, Plus, Trash2, Users } from "lucide-react";
import { assessmentsApi } from "../../api/assessments";
import { frameworksApi } from "../../api/frameworks";
import Layout from "../../components/ui/Layout";
import ErrorMessage from "../../components/ui/ErrorMessage";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import type { Assessment, Framework } from "../../types";

function StatusBadge({ status }: { status: string }) {
  return status === "published"
    ? <span className="badge-green">Published</span>
    : <span className="badge-yellow">Draft</span>;
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frameworkId, setFrameworkId] = useState<number | "">("");
  const [error, setError] = useState("");

  const { data: frameworks = [] } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => frameworksApi.list().then((r) => r.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => assessmentsApi.create({ title, description, framework: frameworkId as number }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      navigate(`/assessments/${res.data.id}/questions`);
    },
    onError: (e: any) => setError(e.response?.data?.title?.[0] || "Failed to create assessment."),
  });

  return (
    <Modal
      title="New assessment"
      description="Pick a framework — you can add questions next."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !title || !frameworkId}
            className="btn-primary"
          >
            {isPending ? "Creating…" : "Create assessment"}
          </button>
        </>
      }
    >
      {error && <ErrorMessage message={error} />}

      <div>
        <label htmlFor="new-title" className="label">Title</label>
        <input
          id="new-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="e.g. Sales Role Assessment"
        />
      </div>

      <div>
        <label htmlFor="new-desc" className="label">
          Description <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="new-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input resize-none"
          rows={2}
          placeholder="Shown to participants before they start"
        />
      </div>

      <div>
        <label htmlFor="new-framework" className="label">Framework</label>
        <select
          id="new-framework"
          value={frameworkId}
          onChange={(e) => setFrameworkId(Number(e.target.value))}
          className="input"
        >
          <option value="">Select a framework</option>
          {frameworks.map((f: Framework) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-500">
          This locks once you send the first invitation.
        </p>
      </div>
    </Modal>
  );
}

export default function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Assessment | null>(null);
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading, error } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => assessmentsApi.list().then((r) => r.data),
  });

  const { mutate: deleteAssessment, isPending: deleting } = useMutation({
    mutationFn: (id: number) => assessmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      setPendingDelete(null);
    },
  });

  const count = assessments.length;

  return (
    <Layout
      title="Assessments"
      subtitle={
        isLoading
          ? undefined
          : count === 0
            ? "Nothing here yet."
            : `${count} assessment${count !== 1 ? "s" : ""}`
      }
      actions={
        count > 0 ? (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New assessment
          </button>
        ) : undefined
      }
    >
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {pendingDelete && (
        <Modal
          size="sm"
          title="Delete assessment?"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button onClick={() => setPendingDelete(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => deleteAssessment(pendingDelete.id)}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-gray-600">
            <span className="font-medium text-gray-900">{pendingDelete.title}</span> and all of
            its questions, invitations and results will be permanently removed. This cannot be
            undone.
          </p>
        </Modal>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="skeleton mb-3 h-5 w-28" />
              <div className="skeleton h-5 w-4/5" />
              <div className="skeleton mt-2 h-4 w-3/5" />
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <div className="skeleton h-3.5 w-24" />
                  <div className="skeleton h-3.5 w-20" />
                </div>
              </div>
              <div className="skeleton mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {error && <ErrorMessage message="Failed to load assessments." />}

      {!isLoading && count === 0 && (
        <div className="card">
          <EmptyState
            icon={<BarChart2 size={22} />}
            title="No assessments yet"
            message="Build a DISC or Big Five assessment, invite participants by email, and read their behavioral profiles as results come in."
          >
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Create assessment
            </button>
          </EmptyState>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assessments.map((a: Assessment) => (
          <article
            key={a.id}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg focus-within:border-gray-300"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <StatusBadge status={a.status} />
                <span className="truncate text-xs font-medium text-gray-400">
                  {a.framework_name}
                </span>
              </div>
              <button
                onClick={() => setPendingDelete(a)}
                aria-label={`Delete ${a.title}`}
                /* z-10 keeps this above the title's full-card overlay link */
                className="focus-ring relative z-10 -mr-1.5 -mt-1 shrink-0 rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* `after:inset-0` makes the whole card clickable without nesting
                interactive elements inside an anchor. */}
            <Link
              to={`/assessments/${a.id}/questions`}
              className="focus-ring rounded after:absolute after:inset-0 after:rounded-xl"
            >
              <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight text-gray-900">
                {a.title}
              </h3>
            </Link>

            <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-gray-500">
              {a.description || <span className="text-gray-300">No description</span>}
            </p>

            <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="tabular flex items-center gap-1.5">
                  <ListChecks size={13} className="text-gray-400" />
                  {a.question_count} question{a.question_count !== 1 ? "s" : ""}
                </span>
                <span className="tabular flex items-center gap-1.5">
                  <Users size={13} className="text-gray-400" />
                  {a.total_invited} invited
                </span>
              </div>

              {a.total_invited > 0 && a.completion_rate !== null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-medium tabular-nums text-gray-900">
                      {a.completion_rate}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-gray-100"
                    role="meter"
                    aria-valuenow={a.completion_rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Completion rate"
                  >
                    <div
                      className="h-1.5 rounded-full bg-primary-600 transition-[width] duration-500 ease-out"
                      style={{ width: `${a.completion_rate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* mt-auto keeps the buttons on the baseline across a row, even when
                one card has a progress bar and its neighbour doesn't. */}
            <div className="relative z-10 mt-auto flex items-center gap-2 pt-4">
              <Link
                to={`/assessments/${a.id}/questions`}
                className="btn-secondary btn-sm flex-1 justify-center"
              >
                Edit
              </Link>
              {a.status === "published" && (
                <Link
                  to={`/assessments/${a.id}/analytics`}
                  className="btn-secondary btn-sm flex-1 justify-center"
                >
                  <BarChart2 size={13} /> Analytics
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
}
