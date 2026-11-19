import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Mail, RefreshCw, Send, Upload } from "lucide-react";
import { assessmentsApi } from "../../api/assessments";
import { invitationsApi } from "../../api/invitations";
import Layout from "../../components/ui/Layout";
import AssessmentTabs from "../../components/ui/AssessmentTabs";
import ErrorMessage from "../../components/ui/ErrorMessage";
import EmptyState from "../../components/ui/EmptyState";
import type { Invitation } from "../../types";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    invited: "badge-blue",
    in_progress: "badge-yellow",
    completed: "badge-green",
    expired: "badge-red",
  };
  return <span className={map[status] || "badge-gray"}>{status.replace("_", " ")}</span>;
}

export default function InvitationsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [emailsText, setEmailsText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [batchError, setBatchError] = useState("");
  const [batchWarning, setBatchWarning] = useState("");
  const [justResent, setJustResent] = useState<number | null>(null);

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentsApi.get(Number(id)).then((r) => r.data),
  });

  const { data: participants = [], isLoading, refetch } = useQuery({
    queryKey: ["participants", id, statusFilter],
    queryFn: () => invitationsApi.listParticipants(Number(id), statusFilter || undefined).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { mutate: sendBatch, isPending: sending } = useMutation({
    mutationFn: () => {
      const emails = emailsText.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
      return invitationsApi.createBatch(Number(id), emails);
    },
    onSuccess: (res: any) => {
      setEmailsText("");
      setBatchError("");
      if (res.data.warnings) {
        setBatchWarning(res.data.warnings.message);
        setTimeout(() => setBatchWarning(""), 5000);
      }
      queryClient.invalidateQueries({ queryKey: ["participants", id] });
    },
    onError: (e: any) => setBatchError(e.response?.data?.error || "Failed to send invitations."),
  });

  const { mutate: resend } = useMutation({
    mutationFn: (invId: number) => invitationsApi.resend(Number(id), invId),
    onSuccess: (_d, invId) => {
      setJustResent(invId);
      setTimeout(() => setJustResent((v) => (v === invId ? null : v)), 2500);
    },
  });

  const { mutate: reissue } = useMutation({
    mutationFn: (invId: number) => invitationsApi.reissue(Number(id), invId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participants", id] }),
  });

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const emails = text.split(/[\n,;]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
      setEmailsText(emails.join("\n"));
    };
    reader.readAsText(file);
  }

  const isPublished = assessment?.status === "published";
  const parsedCount = emailsText
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@")).length;

  return (
    <Layout
      title="Participants"
      subtitle={assessment?.title}
      breadcrumbs={[
        { label: "Assessments", href: "/" },
        { label: assessment?.title || "…", href: `/assessments/${id}` },
        { label: "Invitations" },
      ]}
    >
      <AssessmentTabs assessmentId={id!} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card space-y-4 lg:sticky lg:top-20">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                <Mail size={16} className="text-gray-400" /> Send invitations
              </h3>
              <p className="page-subtitle">
                Each person gets a unique link that expires in{" "}
                {assessment?.link_expiry_days ?? 14} days.
              </p>
            </div>

            {!isPublished && (
              <div className="flex gap-2.5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/15">
                <AlertTriangle size={16} className="mt-px shrink-0 text-amber-500" />
                <p>
                  Publish this assessment before inviting anyone.{" "}
                  <Link
                    to={`/assessments/${id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    Go to settings
                  </Link>
                </p>
              </div>
            )}

            {batchError && <ErrorMessage message={batchError} />}
            {batchWarning && (
              <div className="flex gap-2.5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/15">
                <AlertTriangle size={16} className="mt-px shrink-0 text-amber-500" />
                <p>{batchWarning}</p>
              </div>
            )}

            <div>
              <label htmlFor="emails" className="label">Email addresses</label>
              <textarea
                id="emails"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                className="input resize-y font-mono text-xs leading-relaxed"
                rows={7}
                placeholder={"alice@example.com\nbob@example.com"}
                disabled={!isPublished}
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">One per line, or comma-separated.</p>
                {parsedCount > 0 && (
                  <p className="text-xs font-medium tabular-nums text-gray-600">
                    {parsedCount} recipient{parsedCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <label
              className={`inline-flex items-center gap-1.5 text-sm ${
                isPublished
                  ? "cursor-pointer text-gray-500 hover:text-gray-900"
                  : "cursor-not-allowed text-gray-300"
              }`}
            >
              <Upload size={14} /> Upload CSV
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleCSVUpload}
                disabled={!isPublished}
              />
            </label>

            <button
              onClick={() => sendBatch()}
              disabled={sending || parsedCount === 0 || !isPublished}
              className="btn-primary w-full"
            >
              <Send size={14} />
              {sending
                ? "Sending…"
                : parsedCount > 0
                  ? `Send ${parsedCount} invitation${parsedCount !== 1 ? "s" : ""}`
                  : "Send invitations"}
            </button>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">
              Invited{" "}
              <span className="font-normal tabular-nums text-gray-400">
                ({participants.length})
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input h-8 w-36 py-0 text-sm"
              >
                <option value="">All statuses</option>
                <option value="invited">Invited</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={() => refetch()}
                aria-label="Refresh list"
                className="focus-ring rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card-tight flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-44" />
                    <div className="skeleton h-3 w-28" />
                  </div>
                  <div className="skeleton h-8 w-20" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && participants.length === 0 && (
            <div className="card">
              <EmptyState
                compact
                icon={<Mail size={22} />}
                title={statusFilter ? "No matching participants" : "No participants yet"}
                message={
                  statusFilter
                    ? "Try a different status filter."
                    : "Send your first batch of invitations to start collecting responses."
                }
              />
            </div>
          )}

          <div className="space-y-2">
            {participants.map((inv: Invitation) => (
              <div
                key={inv.id}
                className="card-tight flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-gray-300"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {inv.participant_email}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={inv.status} />
                    <span className="text-xs text-gray-400">
                      expires {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {justResent === inv.id && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success-700">
                      <Check size={13} /> Sent
                    </span>
                  )}
                  {inv.status === "completed" && (
                    <Link
                      to={`/assessments/${id}/participants/${inv.id}`}
                      className="btn-secondary btn-sm"
                    >
                      View result
                    </Link>
                  )}
                  {inv.status === "invited" && (
                    <button onClick={() => resend(inv.id)} className="btn-secondary btn-sm">
                      Resend
                    </button>
                  )}
                  {inv.status === "expired" && (
                    <button onClick={() => reissue(inv.id)} className="btn-secondary btn-sm">
                      Reissue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
