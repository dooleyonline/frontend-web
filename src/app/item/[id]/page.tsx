import { ItemModal } from "@/components/item";
import api from "@/lib/api";
import { QueryClient } from "@tanstack/react-query";

const MarketplaceItem = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const queryClient = new QueryClient();
  const data = await queryClient.fetchQuery(api.item.get(id));

  return (
    <main className="size-full">
      <ItemModal item={data} isLoading={false} />
    </main>
  );
};

export default MarketplaceItem;
