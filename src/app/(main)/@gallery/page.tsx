"use client";

import { itemSearchParams } from "@/lib/types";
import { notFound, useSearchParams } from "next/navigation";

import Home from "./home";
import Search from "./search";

const Gallery = () => {
  const searchParams = useSearchParams();
  const params = itemSearchParams.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!params.success) notFound();

  return searchParams.size > 0 ? <Search params={params.data} /> : <Home />;
};
export default Gallery;
