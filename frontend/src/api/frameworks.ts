import api from "./client";
import type { Framework } from "../types";

export const frameworksApi = {
  list: () => api.get<Framework[]>("/frameworks/"),
  get: (slug: string) => api.get<Framework>(`/frameworks/${slug}/`),
};
