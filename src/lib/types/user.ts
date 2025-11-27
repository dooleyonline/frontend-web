import { z } from "zod";
import { createImageURL } from "../utils";

export const userJsonSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	first_name: z.string(),
	last_name: z.string(),
	avatar: z.string(),
});

export const userSchema = userJsonSchema.transform((data) => ({
	id: data.id,
	email: typeof data.email === "string" ? data.email.trim() : "",
	firstName: data.first_name?.trim() ?? "",
	lastName: data.last_name?.trim() ?? "",
	avatar: createImageURL(data.avatar, "user"),
}));

export type User = z.infer<typeof userSchema>;
