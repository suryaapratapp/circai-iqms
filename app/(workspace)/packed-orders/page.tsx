import { PackedOrdersList } from "@/components/packed-orders/packed-orders-list";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function PackedOrdersPage() {
  const session = await requireSession();
  const orders = await getRepository().listPackedOrders(session);
  return <PackedOrdersList orders={orders} />;
}
