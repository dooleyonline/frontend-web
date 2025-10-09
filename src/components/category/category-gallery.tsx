import { Category } from "@/lib/types";
import { Suspense } from "react";

import { Error } from "../communication";
import { ItemCardSkeleton } from "../item/item-card";
import { CategoryCard, CategoryCardSkeleton } from "./category-card";

type CategoryGalleryProps = {
  data: Category[] | null | undefined;
  isLoading: boolean;
  error: Error | null;
};

export const CategoryGallery = ({
  data,
  isLoading,
  error,
}: CategoryGalleryProps) => {
  if (error) {
    return (
      <Error
        title={error.message}
        description="An error occurred while fetching data."
      />
    );
  }
  if (!isLoading && (!data || data.length === 0)) {
    return <p className="text-muted-foreground">No items found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))
        : data?.map((c, i) => (
            <Suspense fallback={<ItemCardSkeleton />} key={i}>
              <CategoryCard key={i} category={c} />
            </Suspense>
          ))}
    </div>
  );
};
