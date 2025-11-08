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
  page: z
    .string()
    .transform((data) => parseInt(data))
    .optional(),
});

export type ItemSearchParams = z.infer<typeof itemSearchParams>;

export const itemCreateSchema = z.object({
  name: z.string(),
  description: z.string(),
  images: z.array(z.string()),
  price: z.number(),
  condition: z.number(),
  isNegotiable: z.boolean(),
  category: z.string(),
  subcategory: z.string(),
});

export const itemCreateJsonSchema = itemCreateSchema.transform((data) => ({
  name: data.name,
  description: data.description,
  images: data.images,
  price: data.price,
  condition: data.condition,
  is_negotiable: data.isNegotiable,
  category: data.category,
  subcategory: data.subcategory,
}));

export type ItemCreateSchema = z.infer<typeof itemCreateSchema>;

export const presignJsonSchema = z.object({
  url: z.url(),
  headers: z.object(),
  image_id: z.uuid(),
});

export const presignSchema = presignJsonSchema.transform((data) => ({
  URL: data.url,
  headers: data.headers,
  imageID: data.image_id,
}));

export type PresignSchema = z.infer<typeof presignSchema>;
