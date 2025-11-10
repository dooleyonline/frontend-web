"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import ItemDialog from "./dialog";
import { notFound } from "next/navigation";

const ItemDialogPage = ({ params }: PageProps<"/item/[id]">) => {
  const { id } = use(params);

  const { data, error } = useQuery(api.item.get(id));
  if (error) {
    notFound();
  }

  useQuery(api.item.view(id));

  return <ItemDialog item={data} error={error} />;
};

export default ItemDialogPage;
