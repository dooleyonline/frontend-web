"use client";

import { ItemModal } from "@/components/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Item } from "@/lib/types";
import { useRouter } from "next/navigation";

type ItemDialogProps = {
  item: Item | null;
  error: Error | null;
};

const ItemDialog = ({ item, error }: ItemDialogProps) => {
  const router = useRouter();

  return (
    <Dialog defaultOpen onOpenChange={router.back}>
      <DialogContent
        showCloseButton={false}
        className="h-[min(90svh,1000px)] flex flex-col gap-2 bg-background rounded-lg"
      >
        <DialogTitle className="sr-only">{item?.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {item?.description}
        </DialogDescription>
        <ItemModal item={item} isLoading={false} error={error} />
      </DialogContent>
    </Dialog>
  );
};

export default ItemDialog;
