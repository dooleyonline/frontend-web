"use client";

import { Button } from "@/components/ui/button";
import { Item } from "@/lib/types";
import { useEffect, useState } from "react";

import ItemCard from "../item-card";

type ItemGalleryUIProps = {
  data: Item[] | null;
};

export const ItemGalleryUI = ({ data }: ItemGalleryUIProps) => {
  const [selected, setSelected] = useState<"all" | string>("all");
  const [subcategories, setSubcategories] = useState<[string, number][]>([]);
  const [filteredData, setFilteredData] = useState<Item[] | null>(data);

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

      if (selected === "all") {
        setFilteredData(data);
      } else {
        setFilteredData(data.filter((item) => item.subcategory === selected));
      }
    }
  }, [data, selected]);

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">No items found.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap overflow-hidden gap-2 mb-4">
        <>
          <Button
            variant={selected === "all" ? "default" : "secondary"}
            onClick={() => setSelected("all")}
          >
            All
          </Button>
          {subcategories.map(([subcategory, count], i) => (
            <Button
              key={i}
              variant={selected === subcategory ? "default" : "secondary"}
              onClick={() =>
                setSelected(selected === subcategory ? "all" : subcategory)
              }
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
      </div>
      <div className="grid grid-cols-2 gap-x-0 gap-y-1 md:gap-x-1 md:gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
        {filteredData?.map((item: Item, i: number) => (
          <ItemCard key={i} item={item} />
        ))}
      </div>
    </>
  );
};
