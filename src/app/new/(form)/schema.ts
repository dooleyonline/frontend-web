import { useForm } from "react-hook-form";
import * as z from "zod/v4";

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, {
    error: "File cannot be empty",
  })
  .refine(
    (file) => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/heic",
        "image/heif",
        // ...(file.name.toLowerCase().endsWith(".heic")
        //   ? ["application/octet-stream"]
        //   : []),
      ];
      return validTypes.includes(file.type);
    },

    "Only image files are allowed (jpg, png, gif, webp, svg, heic, heif)"
  );

export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  images: z
    .array(imageSchema)
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 files are allowed"),
  condition: z.coerce.number(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  negotiable: z.boolean(),
});

export type FormReturnType = ReturnType<
  typeof useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >
>;

export const defaultFormValues = {
  name: "",
  description: "",
  category: "",
  subcategory: "",
  images: [],
  condition: 3,
  negotiable: false,
  price: 0,
};
