"use client";

import { ItemModal } from "@/components/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";

const ItemDialog = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useQuery(api.item.get(id));

  return (
    <Dialog defaultOpen onOpenChange={router.back}>
      <DialogContent
        showCloseButton={false}
        className="h-[min(90svh,1000px)] flex flex-col gap-2 bg-background rounded-lg"
      >
        <DialogTitle className="sr-only">{data?.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {data?.description}
        </DialogDescription>
        <ItemModal item={data} isLoading={isLoading} error={error} />
      </DialogContent>
    </Dialog>
  );
};

export default ItemDialog;

export const dynamic = "force-static";
export const revalidate = 600;
export const generateStaticParams = async () => {
  const client = new QueryClient();
  const ids = client
    .fetchQuery(api.item.getMany())
    .then((data) => data.map((d) => ({ id: d.id.toString() })));

  return ids;
};
