import { notFound } from "next/navigation";
import { PackedOrderDetailCard } from "@/components/packed-orders/packed-order-detail";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function PackedOrderPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getCachedSession();
  const { orderId } = await params;
  const detail = await getRepository().getPackedOrder(orderId, session);
  if (!detail) {
    notFound();
  }
  return <PackedOrderDetailCard detail={detail} />;
}
