import { Suspense } from "react";

const MarketplaceLayout = ({ gallery, itemDialog }: LayoutProps<"/">) => {
  return (
    <>
      {/* Doesn't need fallback since header is hidden until mounted */}
      <Suspense>{gallery}</Suspense>
      {itemDialog}
    </>
  );
};

export default MarketplaceLayout;
