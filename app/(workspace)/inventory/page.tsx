import { InventoryBoard } from "@/components/inventory/inventory-board";
import { getRepository } from "@/lib/data";
import { requireSession } from "@/lib/auth/session";

export default async function InventoryPage() {
  const session = await requireSession();
  const rows = await getRepository().listInventory(session);

  return <InventoryBoard rows={rows} />;
}
