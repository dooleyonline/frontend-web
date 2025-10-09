import { STORAGE_URL } from "@/lib/env";

export const createImageURL = (src: string): string => {
  const url = new URL(`image/${src}`, STORAGE_URL);

  return url.href;
};
