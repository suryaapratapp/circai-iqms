import { UnpackModule } from "@/components/workflows/unpack-module";
import { getRepository } from "@/lib/data";
import { getCachedSession } from "@/lib/data/server";

export default async function UnpackPage() {
  const session = await getCachedSession();
  const orders = await getRepository().listPackedOrders(session, { limit: 120 });
  return <UnpackModule initialOrders={orders} />;
}
