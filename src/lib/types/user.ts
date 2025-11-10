import { z } from "zod";

const nullableString = z.string().optional().nullable();

export const userJsonSchema = z.object({
  id: z.string().uuid(),
  email: z.string().optional().nullable(),
  first_name: nullableString,
  last_name: nullableString,
  liked_items: z.array(z.number()).catch([]),
  avatar: nullableString,
});

export const userSchema = userJsonSchema.transform((data) => ({
  id: data.id,
  email: typeof data.email === "string" ? data.email.trim() : "",
  firstName: data.first_name?.trim() ?? "",
  lastName: data.last_name?.trim() ?? "",
  likedItems: data.liked_items ?? [],
  avatar: data.avatar?.trim() ?? null,
}));

export type User = z.infer<typeof userSchema>;
