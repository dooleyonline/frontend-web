import { ItemGallery } from "@/components/item";
import SiteHeader from "@/components/site-header";
import api from "@/lib/api";
import { ItemSearchParams } from "@/lib/types";

type SearchProps = {
  params: ItemSearchParams;
};

const Search = ({ params }: SearchProps) => {
  return (
    <>
      <SiteHeader />
      <main>
        <ItemGallery query={api.item.getMany(params)} />
      </main>
    </>
  );
};

export default Search;
