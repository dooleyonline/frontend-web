const MarketplaceLayout = ({ gallery, itemDialog }: LayoutProps<"/">) => {
  return (
    <>
      {gallery}
      {itemDialog}
    </>
  );
};

export default MarketplaceLayout;
