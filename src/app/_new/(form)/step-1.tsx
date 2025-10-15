"use client";

import { Button } from "@/components/ui/button";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  useFileUpload,
} from "@/components/ui/file-upload";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { DropzoneOptions } from "react-dropzone";

import { FormReturnType } from "./schema";

type Step1Props = {
  form: FormReturnType;
  onSubmit: (values: unknown) => void;
};

const Step1 = (props: Step1Props) => {
  const { form, onSubmit } = props;
  const categoryRes = useQuery(api.category.getAll());

  const dropZoneConfig: DropzoneOptions = {
    maxFiles: 10,
    maxSize: 1024 * 1024 * 4,
    multiple: true,
    accept: {
      "image/*": [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".svg",
        ".gif",
        ".heic",
        ".heif",
      ],
    },
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8 grow"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="e.g. Sony PlayStation 5 Digital Edition"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for your listing. Include brand and model if
                applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  id="description"
                  placeholder="e.g. Gently used, includes original box and accessories."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed description of the item. Include when you
                purchased it, any defects, and accessories included.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {categoryRes.error && (
                        <SelectItem value="error" disabled>
                          Error loading categories
                        </SelectItem>
                      )}
                      {categoryRes.isLoading && (
                        <SelectItem value="loading" disabled>
                          Loading categories...
                        </SelectItem>
                      )}
                      {categoryRes.data?.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a category that best fits your item. This helps
                    buyers find your listing easily.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-1">
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch("category", "") === "" ? (
                        <SelectItem value="error" disabled>
                          Please select a category first
                        </SelectItem>
                      ) : (
                        categoryRes.data
                          ?.find(
                            (category) =>
                              category.name === form.watch("category")
                          )
                          ?.subcategory.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          )) || (
                          <SelectItem value="none" disabled>
                            No subcategories available
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a subcategory that best fits your item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <FileUploader
                  value={field.value}
                  onValueChange={field.onChange}
                  dropzoneOptions={dropZoneConfig}
                  className="relative my-1"
                >
                  <FileInput
                    id="fileInput"
                    className="rounded-md outline-dashed outline-2 -outline-offset-2 outline-border"
                  >
                    <div className="flex items-center justify-center flex-col p-8 w-full ">
                      <ImageIcon className="text-muted-foreground w-10 h-10" />
                      <p className="mb-1 text-sm text-muted-foreground font-semibold">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SVG, PNG, JPG, GIF, WEBP, SVG, HEIC, or HEIF
                      </p>
                    </div>
                  </FileInput>

                  {field.value.length > 0 && (
                    <FileUploaderContent className="h-fit px-0 py-1 gap-0">
                      {field.value.map((image, i) => (
                        <FileItem key={`file-${i}`} image={image} index={i} />
                      ))}
                    </FileUploaderContent>
                  )}
                </FileUploader>
              </FormControl>
              <FormDescription>
                Upload up to {dropZoneConfig.maxFiles} images of your item.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 self-end grow items-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  );
};

const FileItem = ({ image, index }: { image: File; index: number }) => {
  const { removeFileFromSet } = useFileUpload();

  return (
    <div className="relative">
      <FileUploaderItem
        index={index}
        className="h-fit cursor-grab bg-background hover:bg-accent rounded-sm"
      >
        <Image
          src={URL.createObjectURL(image)}
          alt="image"
          width={40}
          height={40}
          className="object-cover rounded-sm overflow-hidden relative"
        />
        <span>{image.name}</span>
      </FileUploaderItem>
      <Button
        variant="ghost"
        onClick={() => removeFileFromSet(index)}
        className="absolute right-0 top-1/2 -translate-y-1/2"
      >
        <Trash2Icon size={16} />
      </Button>
    </div>
  );
};

export default Step1;
