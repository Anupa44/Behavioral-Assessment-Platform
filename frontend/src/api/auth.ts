import api from "./client";
import type { Maker } from "../types";

export const authApi = {
  register: (email: string, password: string, password_confirm: string) =>
    api.post("/auth/register/", { email, password, password_confirm }),

  verifyEmail: (token: string) =>
    api.post("/auth/verify-email/", { token }),

  resendVerification: (email: string) =>
    api.post("/auth/resend-verification/", { email }),

  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string; user: Maker }>("/auth/login/", { email, password }),

  googleLogin: (credential: string) =>
    api.post<{ access: string; refresh: string; user: Maker }>("/auth/google/", { credential }),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>("/auth/token/refresh/", { refresh }),

  passwordResetRequest: (email: string) =>
    api.post("/auth/password-reset/", { email }),

  passwordResetConfirm: (token: string, password: string, password_confirm: string) =>
    api.post("/auth/password-reset/confirm/", { token, password, password_confirm }),

  me: () => api.get<Maker>("/auth/me/"),
};
