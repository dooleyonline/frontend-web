import { z } from "zod";

export const userJsonSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  liked_items: z.array(z.number()),
});

export const userSchema = userJsonSchema.transform((data) => ({
  id: data.id,
  email: data.email,
  firstName: data.first_name,
  lastName: data.last_name,
  likedItems: data.liked_items,
}));

export type User = z.infer<typeof userSchema>;
