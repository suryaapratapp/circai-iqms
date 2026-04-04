import { notFound } from "next/navigation";
import { InventoryBoard } from "@/components/inventory/inventory-board";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function InventoryItemPage({
  params
}: {
  params: Promise<{ itemId: string }>;
}) {
  const session = await getCachedSession();
  const rows = await getRepository().listInventory(session);
  const { itemId } = await params;
  if (!rows.find((row) => row.item.itemId === itemId)) {
    notFound();
  }
  return <InventoryBoard rows={rows} selectedItemId={itemId} />;
}
