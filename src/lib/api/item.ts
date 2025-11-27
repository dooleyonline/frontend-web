import {
	Item,
	ItemCreateSchema,
	ItemSearchParams,
	itemCreateJsonSchema,
	itemSchema,
	presignSchema,
} from "@/lib/types";
import axios from "axios";
import { z } from "zod";

import { ApiQueryOptions, apiClient } from "./shared";

export const getMany = (params?: ItemSearchParams): ApiQueryOptions<Item[]> => {
	const url = "item";
	return {
		queryKey: [url, params],
		queryFn: async () => {
			const res = await apiClient.get(url, { params });
			const { data, error } = await z
				.array(itemSchema)
				.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const get = (id: number): ApiQueryOptions<Item> => {
	const url = `item/${id}`;
	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.get(url);
			const { data, error } = await itemSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const getBatch = (ids: number[]): ApiQueryOptions<Item[]> => {
	const url = `item/batch`;
	return {
		queryKey: [url, ids],
		queryFn: async () => {
			const res = await apiClient.post(url, ids);
			const { data, error } = await z
				.array(itemSchema)
				.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const view = (id: number | string): ApiQueryOptions<null> => {
	const url = `item/${id}/view`;
	return {
		queryKey: [url],
		queryFn: async () => {
			await apiClient.post(url);
			return null;
		},
		gcTime: 0,
	};
};

export const create = (item: ItemCreateSchema): ApiQueryOptions<Item> => {
	const url = `item`;
	const { data: parseData, error: parseError } =
		itemCreateJsonSchema.safeParse(item);
	if (parseError) throw new Error(parseError.message);

	return {
		queryKey: [url],
		queryFn: async () => {
			const res = await apiClient.post(url, parseData);
			const { data, error } = await itemSchema.safeParseAsync(res.data);
			if (error) throw new Error(error.message);
			return data;
		},
	};
};

export const uploadImage = (file: File): ApiQueryOptions<string> => {
	const url = `storage/presign`;
	const params = new URLSearchParams({ type: file.type, bucket: "item" });

	return {
		queryKey: [url, params],
		queryFn: async () => {
			const presignRes = await apiClient.post(url, undefined, {
				params,
			});
			const { data: presignData, error: presignError } =
				await presignSchema.safeParseAsync(presignRes.data);
			if (presignError) throw new Error(presignError.message);

			await axios.put(presignData.URL, file, {
				headers: {
					...presignData.headers,
					"Content-Type": file.type,
				},
			});

			return presignData.imageID;
		},
		gcTime: 0,
	};
};

export const like = (itemID: number): ApiQueryOptions<null> => {
	const url = `item/${itemID}/like`;

	return {
		queryKey: [url],
		queryFn: async () => {
			await apiClient.post(url);
			return null;
		},
	};
};

export const unlike = (itemID: number): ApiQueryOptions<null> => {
	const url = `item/${itemID}/unlike`;

	return {
		queryKey: [url],
		queryFn: async () => {
			await apiClient.post(url);
			return null;
		},
	};
};
