import { z } from "zod";

export const signInJsonSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export const signInSchema = signInJsonSchema.transform((data) => ({
  ...data,
}));

export type SignIn = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
});

export type SignUp = z.infer<typeof signUpSchema>;
