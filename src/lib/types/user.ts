import { z } from "zod";

export const userJsonSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const userSchema = userJsonSchema.transform((data) => ({
  ...data,
}));

export type User = z.infer<typeof userSchema>;
