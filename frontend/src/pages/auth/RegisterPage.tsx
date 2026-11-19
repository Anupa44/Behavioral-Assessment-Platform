import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { authApi } from "../../api/auth";
import ErrorMessage from "../../components/ui/ErrorMessage";
import AuthShell from "../../components/ui/AuthShell";
import StatusCard from "../../components/ui/StatusCard";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "At least 8 characters")
    .regex(/\d/, "Must contain a number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character"),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: "Passwords do not match",
  path: ["password_confirm"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError("");
    try {
      await authApi.register(data.email, data.password, data.password_confirm);
      setSuccess(true);
    } catch (e: any) {
      const errs = e.response?.data;
      if (typeof errs === "object") {
        const msgs = Object.values(errs).flat().join(" ");
        setError(msgs || "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Check your email">
        <StatusCard
          tone="success"
          icon={<MailCheck size={22} />}
          title="Verification link sent"
          message="Click the link in your inbox to activate your account. It may take a minute to arrive."
        >
          <Link to="/login" className="btn-secondary w-full">Back to sign in</Link>
        </StatusCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building behavioral assessments in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="focus-ring rounded font-medium text-primary-600 hover:text-primary-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            {...register("password")}
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
          />
          {errors.password ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              At least 8 characters, with a number and a special character.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password_confirm" className="label">Confirm password</label>
          <input
            {...register("password_confirm")}
            id="password_confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password_confirm}
            className={`input ${errors.password_confirm ? "input-error" : ""}`}
            placeholder="••••••••"
          />
          {errors.password_confirm && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password_confirm.message}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full">
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
