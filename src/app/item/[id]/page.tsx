"use client";

import { ItemModal } from "@/components/item";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";

const MarketplaceItem = ({ params }: PageProps<"/item/[id]">) => {
  const { id } = use(params);
  const { data, error } = useQuery(api.item.get(id));
  if (error) {
    notFound();
  }

  useQuery(api.item.view(id));

  return (
    <main className="size-full">
      <ItemModal item={data} isLoading={false} error={error} />
    </main>
  );
};

export default MarketplaceItem;
