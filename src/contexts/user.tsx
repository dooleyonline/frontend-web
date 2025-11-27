"use client";

import api from "@/lib/api";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { PropsWithChildren, createContext, useCallback } from "react";

type UserContextType = {
	user: User | null;
	revalidate: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: PropsWithChildren) => {
	const { data, refetch } = useQuery(api.auth.me());

	const revalidate = useCallback(async () => {
		await refetch();
	}, []);

	return (
		<UserContext.Provider
			value={{ user: data?.verified ? data : null, revalidate }}
		>
			{children}
		</UserContext.Provider>
	);
};
