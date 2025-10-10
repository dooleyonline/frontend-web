"use client";

import ItemGallery from "@/components/item/item-gallery";
import SiteHeader from "@/components/site-header";
import api from "@/lib/api";
import { ItemSearchParams } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type SearchProps = {
  params: ItemSearchParams;
};

const Search = ({ params }: SearchProps) => {
  const res = useQuery(api.item.getMany(params));

  return (
    <>
      <SiteHeader />
      <main>
        <ItemGallery {...res} />
      </main>
    </>
  );
};

export default Search;
