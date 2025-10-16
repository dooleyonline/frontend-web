import { type QueryFunction, type QueryKey } from "@tanstack/react-query";
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
