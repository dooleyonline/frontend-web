import { itemSearchParams } from "@/lib/types";
import { notFound } from "next/navigation";

import Home from "./home";
import Search from "./search";

type GalleryProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const Gallery = async ({ searchParams }: GalleryProps) => {
  const sp = await searchParams;
  const { data, success } = await itemSearchParams.safeParseAsync(sp);

  if (!success) notFound();

  return !!data.q || !!data.category ? <Search params={data} /> : <Home />;
};
export default Gallery;
