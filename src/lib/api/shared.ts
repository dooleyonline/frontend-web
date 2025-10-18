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
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
  withCredentials: true,
});

const queryClient = new QueryClient();

export const serverQuery = async <T,>(query: ApiQueryOptions<T>) => {
  let data: T | null = null;
  let error: Error | null = null;

  try {
    data = await queryClient.fetchQuery(query);
  } catch (e) {
    if (e instanceof Error) error = e;
    else error = new Error("unknown error occurred");
  }

  return { data, error };
};
