import { Skeleton } from "@/components/ui/skeleton";
import { Category } from "@/lib/types";
import Link from "next/link";

import DynamicIcon from "../dynamic-icon";

type CategoryCardProps = {
  category: Category;
};

export const CategoryCard = ({ category }: CategoryCardProps) => {
  const encoded = encodeURIComponent(category.name);

  return (
    <Link
      href={`/?category=${encoded}`}
      className="flex h-[72px] flex-col justify-between rounded-md bg-muted p-3 hover:opacity-75 sm:h-24"
    >
      <DynamicIcon
        name={category.icon}
        className="size-6 text-muted-foreground"
      />
      <span className="block text-left text-sm font-semibold leading-none capitalize">
        {category.name}
      </span>
    </Link>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <Skeleton className="h-20 justify-between rounded-md p-3 sm:h-24 animate-pulse" />
  );
};
