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

export const dynamic = "force-static";
export const revalidate = 600;

export const generateStaticParams = async () => {
  const client = new QueryClient();
  const ids = client
    .fetchQuery(api.item.getMany())
    .then((data) => data.map((d) => ({ id: d.id.toString() })));

  return ids;
};
