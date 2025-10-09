import SiteHeader from "@/components/site-header";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Marketplace @ dooleyonline",
  description: "Find what you need. Sell what you don't",
};

const MarketplaceLayout = ({
  gallery,
  itemDialog,
  children,
}: Readonly<{
  gallery: React.ReactNode;
  itemDialog: React.ReactNode;
  children: React.ReactNode;
}>) => {
  return (
    <>
      {/* Doesn't need fallback since header is hidden until mounted */}
      <Suspense>
        <SiteHeader />
      </Suspense>
      <main>
        <Suspense>{gallery}</Suspense>
        {itemDialog}
        <Suspense>{children}</Suspense>
      </main>
    </>
  );
};

export default MarketplaceLayout;
