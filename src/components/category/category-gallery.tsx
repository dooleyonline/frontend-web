"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { Error } from "../communication";
import { CategoryCard, CategoryCardSkeleton } from "./category-card";

export const CategoryGallery = () => {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
      <Suspense fallback={<CategoryGallerySkeleton />}>
        <CategoryGalleryData />
      </Suspense>
    </div>
  );
};

const CategoryGalleryData = () => {
  const { data, error, isLoading } = useQuery(api.category.getAll());

  if (error) {
    return (
      <Error
        title={error.message}
        description="An error occurred while fetching data."
      />
    );
  }

  return isLoading ? (
    <CategoryGallerySkeleton />
  ) : (
    data?.map((c, i) => <CategoryCard key={i} category={c} />)
  );
};

const CategoryGallerySkeleton = () => {
  return Array.from({ length: 10 }).map((_, i) => (
    <CategoryCardSkeleton key={i} />
  ));
};
