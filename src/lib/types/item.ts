import { z } from "zod";

import { createImageURL } from "../utils";

export const itemJsonSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  placeholder: z.string().nullable(),
  images: z.array(z.string()),
  price: z.number(),
  condition: z.number(),
  is_negotiable: z.boolean(),
  posted_at: z.string(),
  sold_at: z.string().nullable(),
  views: z.number(),
  category: z.string(),
  subcategory: z.string(),
});

export const itemSchema = itemJsonSchema.transform((data) => ({
  id: data.id,
  name: data.name,
  description: data.description,
  placeholder: data.placeholder,
  images: data.images.map((img) => createImageURL(img)),
  price: data.price,
  condition: data.condition,
  isNegotiable: data.is_negotiable,
  postedAt: new Date(data.posted_at),
  soldAt: data.sold_at ? new Date(data.sold_at) : null,
  views: data.views,
  category: data.category,
  subcategory: data.subcategory,
}));

export type Item = z.infer<typeof itemSchema>;

export const itemSearchParams = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.string().optional(),
});

export type ItemSearchParams = z.infer<typeof itemSearchParams>;
