"use server"

import api from "@/lib/api";
import { serverQuery } from "@/lib/api/shared";

import ItemDialog from "./dialog";

const ItemDialogPage = async ({ params }: PageProps<"/item/[id]">) => {
  const { id } = await params;

  const { data, error } = await serverQuery(api.item.get(id));
  await serverQuery(api.item.view(id));

  return <ItemDialog item={data} error={error} />;
};

export default ItemDialogPage;

// export const dynamic = "force-static";
// export const revalidate = 600;

// export const generateStaticParams = async () => {
//   const ids = serverQuery(api.item.getMany()).then(({ data }) =>
//     data ? data.map((item) => ({ id: item.id.toString() })) : []
//   );

//   return ids;
// };
