import Link from "next/link";
import type { PackedOrderDetail } from "@/lib/data/repository";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/utils/format";

export function PackedOrderDetailCard({
  detail
}: {
  detail: PackedOrderDetail;
}) {
  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-3xl font-bold text-ink">
              {detail.order.orderNumber}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Packed by {detail.order.packedByName} • {formatDateTime(detail.order.packedAt)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {detail.location?.name || detail.order.locationId}
            </p>
          </div>
          <Link href={`/api/packing-orders/${detail.order.packingOrderId}/pdf`} target="_blank">
            <Button>Open packing slip</Button>
          </Link>
        </div>
      </SurfaceCard>
      <div className="space-y-3">
        {detail.items.map((item) => (
          <SurfaceCard className="rounded-[28px] p-5" key={item.packingOrderItemId}>
            <p className="font-semibold text-ink">{item.productName}</p>
            <p className="mt-1 text-sm text-slate-600">
              {item.sku} • {item.upc}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 px-4 py-4">
                <p className="text-sm text-slate-500">Shelf</p>
                <p className="mt-1 font-semibold text-ink">{item.shelfCode}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-4">
                <p className="text-sm text-slate-500">Quantity</p>
                <p className="mt-1 font-semibold text-ink">{item.quantity}</p>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
