import { SignInData } from "@/app/(auth)/sign-in/schema";
import { SignUpData } from "@/app/(auth)/sign-up/schema";
import { env } from "@/lib/env";
import axios from "axios";

import { ApiResponse, ENDPOINTS } from "../core";
import { apiFetch } from "../core/client";
import { User } from "./types";

const performTokenRefresh = () => {
  return axios.post<{ access: string }>(
    `${env.API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
    undefined,
    { withCredentials: true }
  );
};

const authApi = {
  me: () => {
    return apiFetch<User>(ENDPOINTS.AUTH.ME);
  },

  refresh: async (): Promise<ApiResponse<{ access: string }>> => {
    try {
      const response = await performTokenRefresh();
      return {
        data: response.data,
        status: response.status,
        ok: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        status: 500,
        ok: false,
        error:
          error instanceof Error ? error : new Error("Unknown fetch error"),
      };
    }
  },

  signIn: (data: SignInData) => {
    return apiFetch<{ access: string }>(ENDPOINTS.AUTH.SIGN_IN, {
      method: "POST",
      data: data,
    });
  },

  signOut: () => {
    return apiFetch<void>(ENDPOINTS.AUTH.SIGN_OUT, {
      method: "POST",
    });
  },

  signUp: (data: SignUpData) => {
    return apiFetch<void>(ENDPOINTS.AUTH.SIGN_UP, {
      method: "POST",
      data,
    });
  },
};

export { authApi, performTokenRefresh, type User };
