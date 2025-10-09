import { z } from "zod";

export const categoryJsonSchema = z.object({
  name: z.string(),
  subcategory: z.array(z.string()),
  icon: z.string(),
});

export const categorySchema = categoryJsonSchema.transform((data) => ({
  ...data,
}));

export type Category = z.infer<typeof categorySchema>;
