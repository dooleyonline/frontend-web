"use client";

import api from "@/lib/api";
import { User } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
} from "react";

const authQueryOptions = api.auth.me();

type UserContextType = {
  user: User | null;
  revalidate: () => Promise<User | null>;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  revalidate: async () => null,
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const { data, error } = useQuery(authQueryOptions);

  const user = error ? null : data ?? null;

  const revalidate = useCallback(async () => {
    try {
      const nextUser = await queryClient.fetchQuery(authQueryOptions);
      return nextUser;
    } catch {
      queryClient.setQueryData(authQueryOptions.queryKey, null);
      return null;
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      revalidate,
    }),
    [user, revalidate],
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
