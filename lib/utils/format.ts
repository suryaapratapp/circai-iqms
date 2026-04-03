import { format, formatDistanceToNow } from "date-fns";

export function formatDateTime(value: string | number | Date) {
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

export function formatShortDate(value: string | number | Date) {
  return format(new Date(value), "dd MMM yyyy");
}

export function formatRelative(value: string | number | Date) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const keys = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );

  const csv = [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map((key) => {
          const value = row[key] ?? "";
          return `"${String(value).replaceAll('"', '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute("download", filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
