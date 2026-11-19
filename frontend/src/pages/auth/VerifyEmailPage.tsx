import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { authApi } from "../../api/auth";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import AuthShell from "../../components/ui/AuthShell";
import StatusCard from "../../components/ui/StatusCard";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((e) => {
        setStatus("error");
        setMessage(e.response?.data?.error || "Verification failed.");
      });
  }, [token]);

  if (status === "loading") return <PageLoader />;

  return (
    <AuthShell title={status === "success" ? "Email verified" : "Verification failed"}>
      {status === "success" ? (
        <StatusCard
          tone="success"
          icon={<CheckCircle2 size={22} />}
          title="You're all set"
          message="Your account is active. Sign in to start building assessments."
        >
          <Link to="/login" className="btn-primary w-full">Sign in</Link>
        </StatusCard>
      ) : (
        <StatusCard
          tone="danger"
          icon={<XCircle size={22} />}
          title="We couldn't verify this link"
          message={message}
        >
          <Link to="/login" className="btn-secondary w-full">Back to sign in</Link>
        </StatusCard>
      )}
    </AuthShell>
  );
}
