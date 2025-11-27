import { Item, User, presignSchema, userSchema } from "@/lib/types";
import axios from "axios";
import { z } from "zod";

import { ApiQueryOptions, apiClient } from "./shared";

export const getAll = (): ApiQueryOptions<User[]> => {
	const url = "user";
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.get(url);
			const { data, error } = await z
				.array(userSchema)
				.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const get = (userID: string): ApiQueryOptions<User> => {
	const url = `user/${userID}`;
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.get(url);
			const { data, error } = await userSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const update = (data: Partial<User>): ApiQueryOptions<null> => {
	const url = `user`;
	return {
		queryKey: [url, data],
		queryFn: async () => {
			await apiClient.put(url, data);
			return null;
		},
	};
};

export const updateAvatar = (user: User, img: File): ApiQueryOptions<null> => {
	const presignURL = `storage/presign`;
	const updateURL = `user`;
	const params = new URLSearchParams({ type: img.type, bucket: "user" });

	return {
		queryKey: [presignURL, params],
		queryFn: async () => {
			const presignRes = await apiClient.post(presignURL, undefined, {
				params,
			});
			const { data: presignData, error: presignError } =
				await presignSchema.safeParseAsync(presignRes.data);
			if (presignError) throw new Error(presignError.message);

			await axios.put(presignData.URL, img, {
				headers: {
					...presignData.headers,
					"Content-Type": img.type,
				},
			});

			await apiClient.put(updateURL, { ...user, avatar: presignData.imageID });

			return null;
		},
		gcTime: 0,
	};
};

export const getLiked = (): ApiQueryOptions<number[]> => {
	const url = `user/liked`;
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.get(url);
			const { data, error } = await z
				.array(
					z.object({
						user_id: z.string(),
						item_id: z.number(),
						created_at: z.string(),
					}),
				)
				.safeParseAsync(res.data);
			if (error) throw new Error(error.message);

			return data.map((d) => d.item_id);
		},
	};
};
