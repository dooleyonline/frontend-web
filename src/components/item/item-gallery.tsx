"use client";

import type { MarketplaceItem } from "@/lib/api/marketplace/types";
import { Suspense } from "react";

import ItemCard, { ItemCardSkeleton } from "./item-card";

type ItemGalleryProps = {
  data: MarketplaceItem[] | null | undefined;
  isLoading: boolean;
  error: string | null;
};

const ItemGallery = ({ data, isLoading, error }: ItemGalleryProps) => {
  if (error) {
    return <p className="text-destructive-foreground">Error: {error}</p>;
  }
  if (!isLoading && (!data || data.length === 0)) {
    return <p className="text-muted-foreground">No items found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-0 gap-y-1 md:gap-x-1 md:gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
      {isLoading
        ? Array.from({ length: 10 }).map((_, i) => <ItemCardSkeleton key={i} />)
        : data?.map((item: MarketplaceItem, i: number) => (
            <Suspense fallback={<ItemCardSkeleton />} key={i}>
              <ItemCard key={i} item={item} index={i} />
            </Suspense>
          ))}
    </div>
  );
};

export default ItemGallery;
