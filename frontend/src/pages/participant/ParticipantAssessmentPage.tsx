import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  TimerOff,
} from "lucide-react";
import { participantApiService } from "../../api/participant";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import StatusCard from "../../components/ui/StatusCard";
import ErrorMessage from "../../components/ui/ErrorMessage";

interface AssessmentData {
  assessment_id: number;
  title: string;
  description: string;
  framework_name: string;
  time_limit_minutes: number | null;
  elapsed_seconds?: number;
  questions: {
    id: number;
    prompt: string;
    order: number;
    options: { id: number; text: string; order: number }[];
  }[];
  session_id: number;
  saved_answers: Record<string, number>;
}

function TimerDisplay({ limitMinutes, elapsedSeconds, onExpire }: {
  limitMinutes: number; elapsedSeconds: number; onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(limitMinutes * 60 - elapsedSeconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 120;

  return (
    <div
      role="timer"
      aria-live={isLow ? "polite" : "off"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ring-1 ring-inset transition-colors ${
        isLow
          ? "bg-red-50 text-red-700 ring-red-600/20"
          : "bg-gray-100 text-gray-700 ring-gray-200/70"
      }`}
    >
      <Clock size={13} className={isLow ? "text-red-500" : "text-gray-400"} />
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}


export default function ParticipantAssessmentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<"loading" | "active" | "error" | "expired" | "completed">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<AssessmentData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [savingAnswer, setSavingAnswer] = useState(false);

  useEffect(() => {
    participantApiService.getAssessment(token!)
      .then((res) => {
        setData(res.data);
        setAnswers(
          Object.fromEntries(
            Object.entries(res.data.saved_answers).map(([k, v]) => [Number(k), v as number])
          )
        );
        setState("active");
        // Resume from last answered question
        const answeredIds = Object.keys(res.data.saved_answers).map(Number);
        if (answeredIds.length > 0 && res.data.questions.length > 0) {
          const lastAnsweredOrder = answeredIds.length;
          setCurrentQ(Math.min(lastAnsweredOrder, res.data.questions.length - 1));
        }
      })
      .catch((e) => {
        const errCode = e.response?.data?.error;
        if (errCode === "expired") setState("expired");
        else if (errCode === "completed") setState("completed");
        else {
          setState("error");
          setErrorMsg(e.response?.data?.message || "Invalid link.");
        }
      });
  }, [token]);

  const selectAnswer = useCallback(async (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSavingAnswer(true);
    try {
      await participantApiService.saveAnswer(token!, questionId, optionId);
    } finally {
      setSavingAnswer(false);
    }
  }, [token]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await participantApiService.submit(token!);
      navigate(`/a/${token}/complete`);
    } catch (e: any) {
      setSubmitError(
        e.response?.data?.error || "Submission failed. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTimeExpire() {
    // Auto-submit
    await handleSubmit();
  }

  if (state === "loading") return <PageLoader />;

  if (state === "expired") return (
    <StatusCard
      fullScreen
      tone="danger"
      icon={<TimerOff size={22} />}
      title="Link expired"
      message="This assessment link has expired. Contact the sender to request a new one."
    />
  );

  if (state === "completed") return (
    <StatusCard
      fullScreen
      tone="success"
      icon={<CheckCircle2 size={22} />}
      title="Already completed"
      message="You've already submitted this assessment. Thanks for your time."
    />
  );

  if (state === "error") return (
    <StatusCard
      fullScreen
      tone="neutral"
      icon={<AlertCircle size={22} />}
      title="Invalid link"
      message={errorMsg}
    />
  );

  if (!data) return <PageLoader />;

  const questions = data.questions;
  const q = questions[currentQ];
  const totalAnswered = Object.keys(answers).length;
  const totalQ = questions.length;
  const progress = totalQ > 0 ? (totalAnswered / totalQ) * 100 : 0;
  const allAnswered = totalAnswered >= totalQ;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-semibold tracking-tight text-gray-900">{data.title}</h1>
            <p className="text-xs text-gray-400">{data.framework_name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-sm tabular-nums text-gray-500">
              {totalAnswered}<span className="text-gray-300">/</span>{totalQ}
            </span>
            {data.time_limit_minutes && (
              <TimerDisplay
                limitMinutes={data.time_limit_minutes}
                elapsedSeconds={data.elapsed_seconds || 0}
                onExpire={handleTimeExpire}
              />
            )}
          </div>
        </div>
        <div
          className="h-0.5 bg-gray-100"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Questions answered"
        >
          <div
            className="h-0.5 bg-primary-600 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        {currentQ === 0 && data.description && (
          <p className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-600 shadow-xs">
            {data.description}
          </p>
        )}

        <div key={q.id} className="animate-fade-in">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Question {currentQ + 1} of {totalQ}
            </span>
            {savingAnswer && (
              <span className="text-xs text-gray-400 animate-fade-in">Saving…</span>
            )}
          </div>

          <h2
            id={`q-${q.id}`}
            className="mb-6 text-xl font-semibold leading-snug tracking-tight text-gray-900"
          >
            {q.prompt}
          </h2>

          <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isSelected = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => selectAnswer(q.id, opt.id)}
                  className={`focus-ring group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-150 ease-out ${
                    isSelected
                      ? "border-primary-600 bg-primary-50/70 text-primary-900 shadow-xs ring-1 ring-inset ring-primary-600"
                      : "border-gray-200 bg-white text-gray-700 shadow-xs hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                  {isSelected && <Check size={16} className="shrink-0 text-primary-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            className="btn-secondary"
          >
            <ArrowLeft size={15} /> Previous
          </button>

          {currentQ < totalQ - 1 ? (
            <button
              onClick={() => setCurrentQ((c) => Math.min(totalQ - 1, c + 1))}
              className="btn-primary"
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="btn-primary"
              title={!allAnswered ? `Answer all ${totalQ} questions first` : undefined}
            >
              {submitting ? "Submitting…" : "Submit assessment"}
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4">
            <ErrorMessage message={submitError} />
          </div>
        )}

        {!allAnswered && currentQ === totalQ - 1 && (
          <p className="mt-3 text-center text-xs text-gray-500">
            {totalQ - totalAnswered} question{totalQ - totalAnswered !== 1 ? "s" : ""} left to
            answer before you can submit.
          </p>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex flex-wrap justify-center gap-1.5">
            {questions.map((qItem, i) => {
              const answered = !!answers[qItem.id];
              const current = i === currentQ;
              return (
                <button
                  key={qItem.id}
                  onClick={() => setCurrentQ(i)}
                  aria-label={`Question ${i + 1}${answered ? ", answered" : ""}`}
                  aria-current={current ? "true" : undefined}
                  className={`focus-ring h-7 w-7 rounded-md text-xs font-medium tabular-nums transition-all duration-150 ${
                    current
                      ? "bg-primary-600 text-white shadow-raised"
                      : answered
                        ? "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20 hover:bg-primary-100"
                        : "bg-white text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
