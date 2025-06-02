import { MarketplaceItemSubcategory } from "@/lib/api/marketplace/types";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function useSubcategories() {
  return useSWR<MarketplaceItemSubcategory[]>(
    "/data/subcategories.json",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 min
    }
  );
}
