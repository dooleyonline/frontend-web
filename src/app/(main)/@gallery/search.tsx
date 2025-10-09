"use client";

import ItemGallery from "@/components/item/item-gallery";
import api from "@/lib/api";
import { ItemSearchParams } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type SearchProps = {
  params: ItemSearchParams;
};

const Search = ({ params }: SearchProps) => {
  const res = useQuery(api.item.getMany(params));

  return <ItemGallery {...res} />;
};

export default Search;
