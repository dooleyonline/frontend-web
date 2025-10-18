import { z } from "zod";

import { SignIn } from "../types/auth";
import { ApiQueryOptions, apiClient } from "./shared";

export const signIn = (params: SignIn): ApiQueryOptions<string> => {
  const url = "auth/login";
  return {
    queryKey: [url],
    queryFn: async () => {
      const res = await apiClient.post(url, params);
      console.log(res.headers);
      const { data, error } = await z.string().safeParseAsync(res.data);
      if (error) throw new Error(error.message);
      return data;
    },
  };
};

// export const status = () => {}
//
// const {data, error} = useQuery(api.auth.status())
