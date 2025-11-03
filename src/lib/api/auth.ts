import { User, userSchema } from "../types";
import { SignIn } from "../types/auth";
import { ApiQueryOptions, apiClient } from "./shared";

export const me = (): ApiQueryOptions<User | null> => {
  const url = "auth/me";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.get(url);
      const { data, error } = await userSchema
        .nullable()
        .safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

export const signIn = (params: SignIn): ApiQueryOptions<User> => {
  const url = "auth/login";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.post(url, params);
      const { data, error } = await userSchema.safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

export const signOut = (): ApiQueryOptions<void> => {
  const url = "auth/logout";
  return {
    queryKey: [url],
    queryFn: async () => {
      await apiClient.post(url);
    },
  };
};
