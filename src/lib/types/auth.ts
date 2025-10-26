import { z } from "zod";

export const signInJsonSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const signInSchema = signInJsonSchema.transform((data) => ({
  ...data,
}));

export type SignIn = z.infer<typeof signInSchema>;
