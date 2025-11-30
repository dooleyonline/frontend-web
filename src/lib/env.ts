const stripTrailingSlash = (value?: string) =>
  value ? value.replace(/\/+$/, "") : "";

export const API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL,
);
// if (!API_BASE_URL)
//   throw new Error("environment variable NEXT_PUBLIC_API_BASE_URL is required");
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL!;
// if (!STORAGE_URL)
//   throw new Error("environment variable NEXT_PUBLIC_STORAGE_URL is required");
export const GOOGLE_MAPS_STATIC_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_STATIC_API_KEY ?? "";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
