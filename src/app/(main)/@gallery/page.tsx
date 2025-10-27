import { itemSearchParams } from "@/lib/types";
import { notFound } from "next/navigation";

import Home from "./home";
import Search from "./search";

export const dynamic = "force-dynamic";

const GalleryPage = async ({ searchParams }: PageProps<"/">) => {
  const sp = await searchParams;
  const isHome = Object.entries(sp).length === 0;
  const { data, error } = await itemSearchParams.safeParseAsync(sp);

  if (error) notFound();

  return isHome ? <Home /> : <Search params={data} />;
};

export default GalleryPage;
