import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../../api/auth";
import { authStore } from "../../store/auth";
import ErrorMessage from "../../components/ui/ErrorMessage";
import AuthShell from "../../components/ui/AuthShell";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        try {
          const { data } = await authApi.googleLogin(response.credential);
          authStore.login(data.access, data.refresh, data.user);
          navigate("/");
        } catch (e: any) {
          setError(e.response?.data?.error || "Google sign-in failed. Please try again.");
        }
      },
    });

    if (googleBtnRef.current) {
      // GSI ignores percentage widths — it needs an explicit pixel value,
      // so match the button to the container's measured width.
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        logo_alignment: "center",
        width: Math.round(googleBtnRef.current.getBoundingClientRect().width),
      });
    }
  }, [navigate]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError("");
    try {
      const res = await authApi.login(data.email, data.password);
      authStore.login(res.data.access, res.data.refresh, res.data.user);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to BehaviorAssess"
      subtitle="Build assessments and read behavioral profiles."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="focus-ring rounded font-medium text-primary-600 hover:text-primary-700"
          >
            Create one
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Google Identity Services renders its button into this node */}
      <div ref={googleBtnRef} className="flex min-h-[40px] w-full justify-center [color-scheme:light]" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

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
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link
              to="/forgot-password"
              className="focus-ring mb-1.5 rounded text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot?
            </Link>
          </div>
          <input
            {...register("password")}
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full">
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
