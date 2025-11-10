import { UserContext } from "@/contexts/user";
import { notFound } from "next/navigation";
import { useContext } from "react";

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");

  if (!ctx.user) {
    notFound();
  }

  return {
    user: ctx.user,
    revalidate: ctx.revalidate,
  };
};
