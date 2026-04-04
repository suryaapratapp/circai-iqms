import { InventoryBoard } from "@/components/inventory/inventory-board";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function InventoryPage() {
  const session = await getCachedSession();
  const rows = await getRepository().listInventory(session);

  return <InventoryBoard rows={rows} />;
}
