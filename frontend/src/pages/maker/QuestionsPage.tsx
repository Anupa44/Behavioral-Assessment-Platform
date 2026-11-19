import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, CheckCircle, RefreshCw, ListChecks } from "lucide-react";
import { assessmentsApi } from "../../api/assessments";
import { frameworksApi } from "../../api/frameworks";
import Layout from "../../components/ui/Layout";
import AssessmentTabs from "../../components/ui/AssessmentTabs";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import EmptyState from "../../components/ui/EmptyState";
import type { Question, Trait, AIGenerationJob, StagedQuestion } from "../../types";

function QuestionEditor({ question, position, traits, assessmentId, onDelete }: {
  question: Question; position: number; traits: Trait[]; assessmentId: number; onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState(question.options.map((o) => ({
    id: o.id, text: o.text, trait: o.trait, order: o.order,
  })));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await assessmentsApi.updateQuestion(assessmentId, question.id, {
        prompt, order: question.order, options,
      });
      queryClient.invalidateQueries({ queryKey: ["questions", assessmentId] });
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div
        className="flex items-start justify-between cursor-pointer gap-4"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-gray-400">Q{position}</span>
            {question.ai_generated && (
              <span className="badge bg-purple-100 text-purple-700 text-xs">AI</span>
            )}
          </div>
          <p className="text-sm text-gray-900 font-medium">{question.prompt}</p>
          <p className="text-xs text-gray-400 mt-0.5">{question.options.length} options</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <div>
            <label className="label">Question</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="input" rows={2} />
          </div>
          <div className="space-y-2">
            <label className="label">Answer Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt.text}
                  onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, text: e.target.value } : o))}
                  className="input flex-1"
                  placeholder={`Option ${i + 1}`}
                />
                <select
                  value={opt.trait}
                  onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, trait: Number(e.target.value) } : o))}
                  className="input w-36"
                >
                  <option value="">Trait</option>
                  {traits.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AIGenerationPanel({ assessmentId, frameworkSlug, onClose }: {
  assessmentId: number; frameworkSlug: string; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [job, setJob] = useState<AIGenerationJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");

  const { data: framework } = useQuery({
    queryKey: ["framework", frameworkSlug],
    queryFn: () => frameworksApi.get(frameworkSlug).then((r) => r.data),
  });

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => assessmentsApi.aiGenerate(assessmentId, prompt, questionCount),
    onSuccess: (res) => {
      setJob(res.data);
      pollJob(res.data.id);
    },
    onError: (e: any) => setError(e.response?.data?.error || "Generation failed."),
  });

  async function pollJob(jobId: number) {
    setPolling(true);
    while (true) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await assessmentsApi.aiJobStatus(assessmentId, jobId);
      setJob(res.data);
      if (res.data.status === "done" || res.data.status === "failed") break;
    }
    setPolling(false);
  }

  const { mutate: acceptAll, isPending: accepting } = useMutation({
    mutationFn: () => assessmentsApi.aiAcceptQuestions(assessmentId, job!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", assessmentId] });
      onClose();
    },
  });

  const { mutate: regenerateQ } = useMutation({
    mutationFn: (stagedId: number) => assessmentsApi.aiRegenerateQuestion(assessmentId, job!.id, stagedId),
    onSuccess: (res: any) => {
      if (job) {
        setJob({
          ...job,
          staged_questions: job.staged_questions.map((sq) =>
            sq.id === res.data.id ? res.data : sq
          ),
        });
      }
    },
  });

  return (
    <div className="card border-purple-200 bg-purple-50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <h3 className="font-semibold text-purple-900">AI Question Generator</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
      </div>

      {!job && (
        <div className="space-y-3">
          {error && <ErrorMessage message={error} />}
          <div>
            <label className="label">What should this assessment measure?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input bg-white"
              rows={3}
              placeholder="e.g. assertiveness and teamwork for a sales role"
            />
          </div>
          <div>
            <label className="label">Number of questions</label>
            <input
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="input bg-white w-24"
            />
          </div>
          <button
            onClick={() => generate()}
            disabled={isPending || !prompt}
            className="btn-primary"
          >
            {isPending ? "Generating…" : "Generate questions"}
          </button>
        </div>
      )}

      {job && (
        <div className="space-y-3">
          {(job.status === "pending" || job.status === "processing" || polling) && (
            <div className="flex items-center gap-3 text-purple-700">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Generating questions…</span>
            </div>
          )}

          {job.status === "failed" && (
            <ErrorMessage message={job.error_message || "Generation failed."} />
          )}

          {job.status === "done" && job.staged_questions.length > 0 && (
            <>
              <p className="text-sm text-purple-800 font-medium">
                {job.staged_questions.filter((q) => !q.rejected).length} questions generated. Review and accept:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {job.staged_questions.filter((q) => !q.rejected).map((sq: StagedQuestion) => (
                  <div key={sq.id} className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-sm font-medium text-gray-900">{sq.prompt}</p>
                    <ul className="mt-1 space-y-0.5">
                      {sq.options_data.map((opt, i) => {
                        const trait = framework?.traits.find((t) => t.code === opt.trait_code);
                        return (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                            <span className="text-gray-400">→</span> {opt.text}
                            <span className="ml-auto text-gray-400">{trait?.name || opt.trait_code}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      onClick={() => regenerateQ(sq.id)}
                      className="mt-2 text-xs text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Regenerate this question
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setJob(null)} className="btn-secondary text-sm">Start over</button>
                <button onClick={() => acceptAll()} disabled={accepting} className="btn-primary text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> {accepting ? "Adding…" : "Accept all"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const { id } = useParams<{ id: string }>();
  // Numeric, so the query key matches the one child components invalidate with
  // (a string id here silently broke list refreshes after AI accept / edits).
  const assessmentId = Number(id);
  const queryClient = useQueryClient();
  const [showAI, setShowAI] = useState(false);

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentsApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions", assessmentId],
    queryFn: () => assessmentsApi.getQuestions(assessmentId).then((r) => r.data),
    enabled: !!id,
  });

  const { data: framework } = useQuery({
    queryKey: ["framework", assessment?.framework_slug],
    queryFn: () => frameworksApi.get(assessment!.framework_slug).then((r) => r.data),
    enabled: !!assessment?.framework_slug,
  });

  const { mutate: deleteQuestion } = useMutation({
    mutationFn: (qid: number) => assessmentsApi.deleteQuestion(Number(id), qid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", assessmentId] }),
  });

  const { mutate: addQuestion, isPending: adding } = useMutation({
    mutationFn: () => assessmentsApi.createQuestion(Number(id), {
      prompt: "New question",
      order: questions.length,
      options: framework?.traits.slice(0, 4).map((t, i) => ({
        text: `Option ${i + 1}`, trait: t.id, order: i,
      })) || [],
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", assessmentId] }),
  });

  const traits = framework?.traits || [];

  return (
    <Layout
      title="Questions"
      subtitle={
        assessment
          ? `${questions.length} question${questions.length !== 1 ? "s" : ""} · ${assessment.framework_name}`
          : undefined
      }
      actions={
        <>
          <button onClick={() => setShowAI(!showAI)} className="btn-secondary">
            <Sparkles size={14} /> AI generate
          </button>
          <button onClick={() => addQuestion()} disabled={adding} className="btn-primary">
            <Plus size={14} /> Add question
          </button>
        </>
      }
      breadcrumbs={[
        { label: "Assessments", href: "/" },
        { label: assessment?.title || "…", href: `/assessments/${id}` },
        { label: "Questions" },
      ]}
    >
      <AssessmentTabs assessmentId={id!} />

      <div className="max-w-2xl space-y-3">
        {showAI && assessment && (
          <AIGenerationPanel
            assessmentId={Number(id)}
            frameworkSlug={assessment.framework_slug}
            onClose={() => setShowAI(false)}
          />
        )}

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card space-y-2.5">
                <div className="skeleton h-3 w-10" />
                <div className="skeleton h-4 w-3/5" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && questions.length === 0 && (
          <div className="card">
            <EmptyState
              icon={<ListChecks size={22} />}
              title="No questions yet"
              message="Write them yourself, or let AI draft a set from your framework's traits and refine from there."
            >
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => addQuestion()} disabled={adding} className="btn-primary">
                  <Plus size={14} /> Add question
                </button>
                <button onClick={() => setShowAI(true)} className="btn-secondary">
                  <Sparkles size={14} /> AI generate
                </button>
              </div>
            </EmptyState>
          </div>
        )}

        {questions.map((q: Question, i: number) => (
          <QuestionEditor
            key={q.id}
            question={q}
            position={i + 1}
            traits={traits}
            assessmentId={Number(id)}
            onDelete={() => deleteQuestion(q.id)}
          />
        ))}

        {questions.length > 0 && assessment?.status === "draft" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 p-4">
            <p className="text-sm text-gray-600">
              Happy with these? Publish to start inviting participants.
            </p>
            <Link to={`/assessments/${id}`} className="btn-secondary btn-sm shrink-0">
              Go to settings
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
