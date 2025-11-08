"use client";

import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { PropsWithChildren, createContext, useEffect, useState } from "react";

type UserContextType = {
  user: User | null;
  revalidate: Function;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  revalidate: () => {},
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const { data, error } = useQuery(api.auth.me());

  const revalidate = async () => {
    const { data, error } = await serverQuery(api.auth.me());
    if (error) {
      setUser(null);
      return;
    }
    setUser(data);
  };

  useEffect(() => {
    if (error) {
      setUser(null);
      return;
    }

    setUser(data ?? null);
  }, [data, error]);

  return (
    <UserContext.Provider value={{ user, revalidate }}>
      {children}
    </UserContext.Provider>
  );
};
