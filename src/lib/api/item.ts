import { Item, ItemSearchParams, itemSchema } from "@/lib/types";
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
      return data.slice(10);
    },
  };
};

export const get = (id: number | string): ApiQueryOptions<Item> => {
  const url = `item/${id}`;
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url);
      const { data, error } = await itemSchema.safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

export const view = (id: number | string): ApiQueryOptions<null> => {
  const url = `item/${id}/view`;
  return {
    queryKey: [url],
    queryFn: async () => {
      await apiClient.post(url);
      return null;
    },
  };
};
