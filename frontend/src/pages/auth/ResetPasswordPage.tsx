import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../../api/auth";
import ErrorMessage from "../../components/ui/ErrorMessage";
import AuthShell from "../../components/ui/AuthShell";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/\d/, "Must contain a number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError("");
    try {
      await authApi.passwordResetConfirm(token, data.password, data.password_confirm);
      navigate("/login?reset=success");
    } catch (e: any) {
      setError(e.response?.data?.error || "Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
      footer={
        <Link
          to="/login"
          className="focus-ring rounded font-medium text-primary-600 hover:text-primary-700"
        >
          Back to sign in
        </Link>
      }
    >
      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">New password</label>
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
          {isLoading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}
