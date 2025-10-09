import { Category, categorySchema } from "@/lib/types";
import { createApiUrl } from "@/lib/utils";
import axios from "axios";
import { z } from "zod";

import { ApiQueryOptions } from "./shared";

export const getAll = (): ApiQueryOptions<Category[]> => {
  const url = createApiUrl("category");
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await axios.get(url);
      const { data, error } = await z
        .array(categorySchema)
        .safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};
