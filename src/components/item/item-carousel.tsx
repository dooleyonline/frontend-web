"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Item } from "@/lib/types";
import { motion } from "motion/react";
import Image from "next/image";
import { memo, useEffect, useState } from "react";

import { Skeleton } from "../ui/skeleton";

type ItemCarouselProps = {
  item: Item | null | undefined;
  isLoading?: boolean;
};

const ItemCarousel = memo((props: ItemCarouselProps) => {
  const { item, isLoading = !!item } = props;

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const itemId = item?.id ?? null;
  const imageCount = item?.images.length ?? 0;

  useEffect(() => {
    if (!api || !itemId) return;

    api.scrollTo(0);
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api, itemId]);

  const handleClick = () => {
    if (!api) return;
    if (current === imageCount - 1) api.scrollTo(0);
    else api.scrollNext();
  };

  return (
    <Carousel key={itemId ?? "empty"} setApi={setApi}>
      <CarouselContent className="@container">
        {isLoading || imageCount === 0 ? (
          <CarouselItem className="@xl:basis-1/2 @2xl:basis-1/3">
            <AspectRatio ratio={1 / 1} className="rounded-lg w-full">
              <Skeleton className="size-full" />
            </AspectRatio>
          </CarouselItem>
        ) : (
          (item?.images ?? []).map((image, index) => (
            <CarouselItem key={index} className="@xl:basis-1/2 @2xl:basis-1/3">
              <AspectRatio
                ratio={1 / 1}
                className="rounded-lg overflow-hidden border"
              >
                <Image
                  src={image}
                  alt={item!.name}
                  fill
                  quality={60}
                  loading="lazy"
                  placeholder={item?.placeholder ? "blur" : undefined}
                  blurDataURL={item?.placeholder ?? undefined}
                  sizes="(max-width: 640px) 80vw, (max-width: 768px) 70vw, (max-width: 1024px) 50vw, 600px"
                  className="object-cover"
                />
              </AspectRatio>
            </CarouselItem>
          ))
        )}
      </CarouselContent>
      <div className="flex justify-between mt-2">
        <CarouselPrevious className="relative translate-x-0 translate-y-0 left-0 top-0" />
        <div
          onClick={handleClick}
          className="py-2 flex gap-1 items-center cursor-pointer"
        >
          {Array.from({ length: imageCount }).map((_, i) => (
            <motion.div
              key={i}
              animate={
                i === current
                  ? {
                      width: 12,
                      opacity: 0.8,
                    }
                  : { width: 8, opacity: 0.2 }
              }
              className="h-2 rounded-full border bg-muted-foreground"
            />
          ))}
        </div>
        <CarouselNext className="relative translate-x-0 translate-y-0 left-0 top-0" />
      </div>
    </Carousel>
  );
});
ItemCarousel.displayName = "ItemCarousel";

export default ItemCarousel;
