"use client"

import { ItemGallery } from "@/components/item";
import SiteHeader from "@/components/site-header";
import api from "@/lib/api";
import { ItemSearchParams } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type SearchProps = {
  params: ItemSearchParams;
};

const Search = ({ params }: SearchProps) => {
  const items = useQuery(api.item.getMany(params));
  return (
    <>
      <SiteHeader />
      <main>
        <ItemGallery {...items} />
      </main>
    </>
  );
};

export default Search;
