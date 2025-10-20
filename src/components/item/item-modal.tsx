"use client";

import {
  ItemConditionBadge,
  ItemNegotiableBadge,
} from "@/components/item/item-badge";
import ItemCarousel from "@/components/item/item-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Item } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import getRelativeTime from "@/lib/utils/get-relative-time";
import { HeartIcon } from "lucide-react";
import { memo } from "react";

import { Skeleton } from "../ui/skeleton";

type ItemModalProps = {
  item?: Item | null;
  isLoading?: boolean;
  error?: unknown;
  isPreview?: boolean;
  className?: string;
};

export const ItemModal = memo((props: ItemModalProps) => {
  const { item, isLoading = false, error, isPreview, className } = props;

  if (error) console.error("Error loading item:", error);

  const relativeTime = item?.postedAt ? getRelativeTime(item.postedAt) : "";

  return (
    <Card className={cn("h-full shadow-none border-none p-0", className)}>
      <CardContent className="h-full p-0 bg-background relative">
        <div
          className={cn(
            "h-full overflow-auto flex flex-col gap-2 pb-14",
            isPreview && "pb-0"
          )}
        >
          <ItemCarousel
            item={item}
            isLoading={isLoading}
          />

          <CardHeader className="text-left p-0 grow mb-2 !block">
            {!item || isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <CardTitle className="text-2xl font-medium break-words">
                {item.name === "" ? (
                  <span className="text-muted-foreground">Item Name</span>
                ) : (
                  item.name
                )}
              </CardTitle>
            )}
            <div className="flex gap-1 my-2!">
              <ItemConditionBadge
                condition={item?.condition}
                isLoading={isLoading}
              />
              <ItemNegotiableBadge
                negotiable={item?.isNegotiable}
                isLoading={isLoading}
              />
            </div>

            <span className="block my-3! text-xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                formatPrice(item?.price)
              )}
            </span>

            <CardDescription className="text-secondary-foreground text-base whitespace-pre-line">
              {!item || isLoading ? (
                <>
                  <Skeleton className="h-4 w-full my-2" />
                  <Skeleton className="h-4 w-full my-2" />
                  <Skeleton className="h-4 w-1/3 my-2" />
                </>
              ) : item.description === "" ? (
                <span className="text-muted-foreground">Description</span>
              ) : (
                item.description
              )}
            </CardDescription>
          </CardHeader>

          <div className="flex gap-2 items-center">
            <Avatar className="size-8">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>

            {!item || isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <div>
                <span className="mr-2 inline-block">Ethan Lee</span>
                <small className="text-muted-foreground">
                  {relativeTime} · {item.views} views
                </small>
              </div>
            )}
          </div>
        </div>

        {!isPreview && (
          <CardFooter className="absolute bottom-0 left-0 gap-2 p-0 w-full bg-background">
            <Button variant="default" size="lg" className="flex-1">
              Contact Seller
            </Button>
            <Button size="lg" variant="outline" className="flex-0">
              <HeartIcon />
            </Button>
          </CardFooter>
        )}
      </CardContent>
    </Card>
  );
});
ItemModal.displayName = "ItemModal";
