import { API_BASE_URL } from "@/lib/env";

export const createApiUrl = (
  path: string,
  params?: Record<string, string>
): string => {
  const url = new URL(path, API_BASE_URL);
  for (const k in params) {
    url.searchParams.append(k, params[k]);
  }

  return url.href;
};
