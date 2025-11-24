import { STORAGE_URL } from "@/lib/env";

type Bucket = "item" | "user";

export const createImageUrl = (src: string, bucket?: Bucket): string => {
  const url = new URL(
    `/storage/v1/object/public/${bucket ?? "item"}/${src}`,
    STORAGE_URL
  );

  return url.href;
};
