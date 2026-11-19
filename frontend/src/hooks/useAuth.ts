import { useSyncExternalStore } from "react";
import { authStore } from "../store/auth";

export function useAuth() {
  const user = useSyncExternalStore(
    authStore.subscribe.bind(authStore),
    () => authStore.user
  );
  const isAuthenticated = useSyncExternalStore(
    authStore.subscribe.bind(authStore),
    () => authStore.isAuthenticated
  );

  return { user, isAuthenticated };
}
