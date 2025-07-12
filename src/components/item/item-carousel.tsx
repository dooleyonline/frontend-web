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
import type { MarketplaceItem } from "@/lib/api/marketplace/types";
import getImageURL from "@/lib/utils/get-image-url";
import { motion } from "motion/react";
import Image from "next/image";
import { memo, useEffect, useState } from "react";

import { Skeleton } from "../ui/skeleton";

type ItemCarouselProps = {
  item: MarketplaceItem | null | undefined;
  isLoading?: boolean;
  isPreview?: boolean;
};

const ItemCarousel = memo((props: ItemCarouselProps) => {
  const { item, isLoading = !!item, isPreview } = props;

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api || !item) return;

    api.scrollTo(0);
    setCount(item.images.length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, item?.images.length, item]);

  const handleClick = () => {
    if (!api) return;
    if (current === count - 1) api.scrollTo(0);
    else api.scrollNext();
  };

  return (
    <Carousel setApi={setApi}>
      <CarouselContent className="@container">
        {isLoading || item!.images.length === 0 ? ( // non-null assertion since isLoading is true when item is falsy
          <CarouselItem className="@xl:basis-1/2 @2xl:basis-1/3">
            <AspectRatio ratio={1 / 1} className="rounded-lg w-full">
              <Skeleton className="size-full" />
            </AspectRatio>
          </CarouselItem>
        ) : (
          item!.images.map((image, index) => (
            <CarouselItem key={index} className="@xl:basis-1/2 @2xl:basis-1/3">
              <AspectRatio
                ratio={1 / 1}
                className="rounded-lg overflow-hidden border"
              >
                <Image
                  src={isPreview ? image : getImageURL(image)}
                  alt={item!.name}
                  fill
                  quality={60}
                  loading="lazy"
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
          {[...Array(count)].map((_, i) => (
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
