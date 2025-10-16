import { Category, categorySchema } from "@/lib/types";
import { z } from "zod";

import { ApiQueryOptions, apiClient } from "./shared";

export const getAll = (): ApiQueryOptions<Category[]> => {
  const url = "category";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url);
      const { data, error } = await z
        .array(categorySchema)
        .safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};
