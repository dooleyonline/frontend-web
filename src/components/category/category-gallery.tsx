import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";
import { Suspense } from "react";

import { Error } from "../communication";
import { CategoryCard, CategoryCardSkeleton } from "./category-card";

export const CategoryGallery = async () => {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
      <Suspense fallback={<CategoryGallerySkeleton />}>
        <CategoryGalleryData />
      </Suspense>
    </div>
  );
};

const CategoryGalleryData = async () => {
  const { data, error } = await serverQuery(api.category.getAll());

  if (error) {
    return (
      <Error
        title={error.message}
        description="An error occurred while fetching data."
      />
    );
  }

  return data?.map((c, i) => <CategoryCard key={i} category={c} />);
};

const CategoryGallerySkeleton = () => {
  return Array.from({ length: 10 }).map((_, i) => (
    <CategoryCardSkeleton key={i} />
  ));
};
