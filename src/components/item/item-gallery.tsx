"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Item } from "@/lib/types";
import { Suspense, memo, useEffect, useState } from "react";

import { Error } from "../communication";
import ItemCard, { ItemCardSkeleton } from "./item-card";

type ItemGalleryProps = {
  data: Item[] | null | undefined;
  isFetching: boolean;
  isPending: boolean;
  error: Error | null;
};

const ItemGallery = memo(
  ({ data, isFetching, isPending, error }: ItemGalleryProps) => {
    const [selected, setSelected] = useState<string>("All");
    const [subcategories, setSubcategories] = useState<[string, number][]>([]);
    const [filteredData, setFilteredData] = useState<Item[]>([]);
    const isLoading = isFetching || isPending;

    useEffect(() => {
      if (data) {
        const map = new Map<string, number>();
        data.forEach((item) => {
          if (map.has(item.subcategory)) {
            map.set(item.subcategory, map.get(item.subcategory)! + 1);
          } else {
            map.set(item.subcategory, 1);
          }
        });

        const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);

        setSubcategories(sorted);

        if (selected === "All") {
          setFilteredData(data);
        } else {
          setFilteredData(data.filter((item) => item.subcategory === selected));
        }
      }
    }, [data, selected]);

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
      <>
        <div className="flex flex-wrap overflow-hidden gap-2 mb-4">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md w-16 animate-pulse" />
            ))
          ) : (
            <>
              <Button
                variant={selected === "All" ? "default" : "secondary"}
                onClick={() => setSelected("All")}
              >
                All
              </Button>
              {subcategories.map(([subcategory, count], i) => (
                <Button
                  key={i}
                  variant={selected === subcategory ? "default" : "secondary"}
                  onClick={() => setSelected(subcategory)}
                  className="leading-none items-center capitalize"
                >
                  {subcategory}
                  <span
                    style={{
                      color:
                        selected === subcategory
                          ? "var(--muted)"
                          : "var(--muted-foreground)",
                    }}
                    className="text-xs"
                  >
                    {count}
                  </span>
                </Button>
              ))}
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-0 gap-y-1 md:gap-x-1 md:gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            : filteredData.map((item: Item, i: number) => (
                <Suspense fallback={<ItemCardSkeleton />} key={i}>
                  <ItemCard key={i} item={item} index={i} />
                </Suspense>
              ))}
        </div>
      </>
    );
  }
);
ItemGallery.displayName = "ItemGallery";

export default ItemGallery;
