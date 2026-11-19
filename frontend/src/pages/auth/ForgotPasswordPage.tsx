import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { authApi } from "../../api/auth";
import AuthShell from "../../components/ui/AuthShell";
import StatusCard from "../../components/ui/StatusCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.passwordResetRequest(email);
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <StatusCard
          tone="success"
          icon={<MailCheck size={22} />}
          title="Reset link sent"
          message={`If an account exists for ${email}, a password reset link is on its way.`}
        >
          <Link to="/login" className="btn-secondary w-full">Back to sign in</Link>
        </StatusCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link
          to="/login"
          className="focus-ring rounded font-medium text-primary-600 hover:text-primary-700"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@company.com"
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full">
          {isLoading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
