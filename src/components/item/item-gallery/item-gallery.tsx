"use server";

import { Error } from "@/components/communication";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiQueryOptions, serverQuery } from "@/lib/api/shared";
import { Item } from "@/lib/types";
import { Suspense } from "react";

import { ItemCardSkeleton } from "../item-card";
import { ItemGalleryUI } from "./ui";

type ItemGalleryServerProps = {
  query: ApiQueryOptions<Item[]>;
};

export const ItemGallery = async ({ query }: ItemGalleryServerProps) => {
  return (
    <Suspense fallback={<ItemGallerySkeleton />}>
      <ItemGalleryData query={query} />
    </Suspense>
  );
};

const ItemGalleryData = async ({ query }: ItemGalleryServerProps) => {
  const { data, error } = await serverQuery(query);

  if (error) {
    return (
      <Error
        title={error.message}
        description="An error occurred while fetching data."
      />
    );
  }

  return <ItemGalleryUI data={data} />;
};

const ItemGallerySkeleton = () => {
  return (
    <>
      <div className="flex flex-wrap overflow-hidden gap-2 mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-md w-16 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-0 gap-y-1 md:gap-x-1 md:gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
        {Array.from({ length: 10 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
};
