import { User, presignSchema, userSchema } from "@/lib/types";
import axios from "axios";
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

export const update = (
  data: Partial<User>
): ApiQueryOptions<null> => {
  const url = `user`;
  return {
    queryKey: [url, data],
    queryFn: async () => {
      await apiClient.put(url, data);
      return null;
    },
  };
};

export const updateAvatar = (user: User, img: File): ApiQueryOptions<null> => {
  const presignURL = `storage/presign`;
  const updateURL = `user`;
  const params = new URLSearchParams({ type: img.type, bucket: "user" });

  return {
    queryKey: [presignURL, params],
    queryFn: async () => {
      const presignRes = await apiClient.post(presignURL, undefined, {
        params,
      });
      const { data: presignData, error: presignError } =
        await presignSchema.safeParseAsync(presignRes.data);
      if (presignError) throw new Error(presignError.message);

      await axios.put(presignData.URL, img, {
        headers: {
          ...presignData.headers,
          "Content-Type": img.type,
        },
      });

      await apiClient.put(updateURL, { ...user, avatar: presignData.imageID });

      return null;
    },
    gcTime: 0,
  };
};
