import {
  QueryClient,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../env";

export type ApiQueryOptions<T> = {
  queryKey: QueryKey;
  queryFn: QueryFunction<T>;
  gcTime?: number;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
  withCredentials: true,
});

let queryClient = new QueryClient();

export const serverQuery = async <T,>(query: ApiQueryOptions<T>) => {
  let data: T | null = null;
  let error: Error | null = null;
  // disable cache by initializing new client
  if (query.gcTime === 0) {
    queryClient = new QueryClient();
  }

  try {
    data = await queryClient.fetchQuery(query);
  } catch (e) {
    if (e instanceof Error) error = e;
    else error = new Error("unknown error occurred");
  }

  return { data, error };
};
