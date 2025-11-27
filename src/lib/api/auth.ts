import { z } from "zod";
import { User, userSchema, Verification, verificationSchema } from "../types";
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

export const signIn = (
	email: string,
	password: string,
): ApiQueryOptions<User> => {
	const url = "auth/login";
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.post(url, {
				email,
				password,
			});
			const { data, error } = await userSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const signOut = (): ApiQueryOptions<null> => {
	const url = "auth/logout";
	return {
		queryKey: [url],
		queryFn: async () => {
			await apiClient.post(url);
			return null;
		},
	};
};

export const signUp = (
	firstName: string,
	lastName: string,
	email: string,
	password: string,
): ApiQueryOptions<User> => {
	const url = "user";
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.post(url, {
				firstName,
				lastName,
				email,
				password,
			});
			const { data, error } = await userSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const sendVerification = (
	userID: string,
	email: string,
): ApiQueryOptions<string> => {
	const url = `auth/verify`;
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.post(url, { userID, email });
			const { data, error } = await z.string().safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const getVerification = (
	verificationID: string,
): ApiQueryOptions<Verification> => {
	const url = `auth/verify/${verificationID}`;
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.get(url);
			const { data, error } = await verificationSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const verify = (
	verificationID: string,
	token: string,
): ApiQueryOptions<boolean> => {
	const url = `auth/verify/${verificationID}`;
	return {
		queryKey: [url, token],
		queryFn: async () => {
			const res = await apiClient.post(url, { token });
			return res.status === 204;
		},
	};
};
