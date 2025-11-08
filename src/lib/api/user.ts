import { User, userSchema } from "@/lib/types";
import { z } from "zod";

import { ApiQueryOptions, apiClient } from "./shared";

export const getAll = (): ApiQueryOptions<User[]> => {
  const url = "user";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url);
      const { data, error } = await z
        .array(userSchema)
        .safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

export const get = (id: string): ApiQueryOptions<User> => {
  const url = `user/${id}`;
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url);
      const { data, error } = await userSchema.safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};
