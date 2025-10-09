import { Item, ItemSearchParams, itemSchema } from "@/lib/types";
import { createApiUrl } from "@/lib/utils";
import axios from "axios";
import { z } from "zod";

import { ApiQueryOptions, apiClient } from "./shared";

export const getMany = (params?: ItemSearchParams): ApiQueryOptions<Item[]> => {
  const url = "item";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url, { params });
      const { data, error } = await z
        .array(itemSchema)
        .safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

export const get = (id: number | string): ApiQueryOptions<Item> => {
  const url = createApiUrl(`item/${id}`);
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await axios.get(url);
      const { data, error } = await itemSchema.safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};
