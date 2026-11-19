import type { Maker } from "../types";

let _user: Maker | null = null;

try {
  const stored = localStorage.getItem("user");
  if (stored) _user = JSON.parse(stored);
} catch {}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const authStore = {
  get user() { return _user; },
  get isAuthenticated() { return !!_user && !!localStorage.getItem("access_token"); },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  login(access: string, refresh: string, user: Maker) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(user));
    _user = user;
    notify();
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    _user = null;
    notify();
  },

  setUser(user: Maker) {
    _user = user;
    localStorage.setItem("user", JSON.stringify(user));
    notify();
  },
};
