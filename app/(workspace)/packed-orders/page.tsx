import { PackedOrdersList } from "@/components/packed-orders/packed-orders-list";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function PackedOrdersPage() {
  const session = await getCachedSession();
  const orders = await getRepository().listPackedOrders(session);
  return <PackedOrdersList orders={orders} />;
}
