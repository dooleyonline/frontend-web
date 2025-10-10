import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Marketplace @ dooleyonline",
  description: "Find what you need. Sell what you don't",
};

const MarketplaceLayout = ({
  gallery,
  itemDialog,
}: Readonly<{
  gallery: ReactNode;
  itemDialog: ReactNode;
}>) => {
  return (
    <>
      {/* Doesn't need fallback since header is hidden until mounted */}
      {gallery}
      {itemDialog}
    </>
  );
};

export default MarketplaceLayout;
