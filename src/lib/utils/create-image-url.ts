import { STORAGE_URL } from "@/lib/env";

export const createImageUrl = (src: string): string => {
  const url = new URL(`/storage/v1/object/public/image/${src}`, STORAGE_URL);

  return url.href;
};
