"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AdminData } from "@/lib/data/repository";
import { appConfig } from "@/lib/config/app";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/utils/format";

const tabs = [
  "Users",
  "Roles",
  "Locations",
  "Shelves",
  "Items",
  "Quality Templates",
  "Reason Codes",
  "Settings",
  "Audit Trail"
] as const;

export function AdminConsole({ data }: { data: AdminData }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Users");

  async function importStock(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/import-stock", {
      method: "POST",
      body: formData
    });
    const result = (await response.json()) as { error?: string; rowsAccepted?: number };
    if (!response.ok) {
      toast.error(result.error || "Unable to import stock.");
      return;
    }
    toast.success(`Imported ${result.rowsAccepted} stock rows successfully.`);
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
          {appConfig.name}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">{appConfig.subtitle}</p>
        <p className="font-heading text-3xl font-bold text-ink">Settings / Admin</p>
        <p className="mt-2 text-sm text-slate-600">
          Manage authorised users, shelves, product master data, checklist templates, and stock imports.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            Import RZ-Circular stock
            <input
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  importStock(file);
                }
              }}
              type="file"
            />
          </label>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
            Supports CSV, XLSX, duplicate handling, and shelf/SKU/quantity mapping.
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                activeTab === tab
                  ? "bg-ink text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard className="rounded-[32px] p-6">
        {activeTab === "Users" ? (
          <Table
            columns={[
              "Name",
              "Email",
              "Role",
              "Location",
              "Status",
              "Google",
              "Last sign-in"
            ]}
            rows={data.users.map((user) => [
              user.fullName,
              user.email,
              user.role,
              user.assignedLocationId,
              <StatusBadge key={`${user.userId}-status`} value={user.status} />,
              user.googleLinked ? "Linked" : "Not linked",
              user.lastLogin ? formatDateTime(user.lastLogin) : "-"
            ])}
          />
        ) : null}
        {activeTab === "Roles" ? (
          <Table
            columns={["Role", "Description", "Permissions"]}
            rows={data.roles.map((role) => [
              role.name,
              role.description,
              role.permissions.join(", ")
            ])}
          />
        ) : null}
        {activeTab === "Locations" ? (
          <Table
            columns={["Code", "Name", "Address", "Timezone", "Status"]}
            rows={data.locations.map((location) => [
              location.code,
              location.name,
              location.address,
              location.timezone,
              <StatusBadge key={`${location.locationId}-status`} value={location.status} />
            ])}
          />
        ) : null}
        {activeTab === "Shelves" ? (
          <Table
            columns={["Code", "Location", "Zone", "Aisle", "Rack", "Shelf", "Capacity"]}
            rows={data.shelves.map((shelf) => [
              shelf.code,
              shelf.locationId,
              shelf.zone,
              shelf.aisle,
              shelf.rack,
              shelf.shelf,
              shelf.capacityUnits
            ])}
          />
        ) : null}
        {activeTab === "Items" ? (
          <Table
            columns={["SKU", "Name", "Category", "Supplier", "Reorder", "QC Required"]}
            rows={data.items.map((item) => [
              item.sku,
              item.itemName,
              item.category,
              item.supplier,
              item.reorderThreshold,
              item.requiresQualityCheck ? "Yes" : "No"
            ])}
          />
        ) : null}
        {activeTab === "Quality Templates" ? (
          <Table
            columns={["Name", "Category", "Sampling", "Checklist"]}
            rows={data.qualityTemplates.map((template) => [
              template.name,
              template.category,
              template.samplingMode,
              template.checklist.join(", ")
            ])}
          />
        ) : null}
        {activeTab === "Reason Codes" ? (
          <Table
            columns={["Code", "Category", "Label", "Approval"]}
            rows={data.reasonCodes.map((reasonCode) => [
              reasonCode.code,
              reasonCode.category,
              reasonCode.label,
              reasonCode.approvalRequired ? "Yes" : "No"
            ])}
          />
        ) : null}
        {activeTab === "Settings" ? (
          <Table
            columns={["Key", "Value", "Description"]}
            rows={data.settings.map((setting) => [
              setting.key,
              setting.value,
              setting.description
            ])}
          />
        ) : null}
        {activeTab === "Audit Trail" ? (
          <Table
            columns={["When", "User", "Action", "Entity", "Notes"]}
            rows={data.auditTrail.map((record) => [
              formatDateTime(record.timestamp),
              record.userName,
              record.actionType,
              `${record.sku || "Stock"} • ${record.locationId}`,
              record.notes || "-"
            ])}
          />
        ) : null}
      </SurfaceCard>
    </div>
  );
}

function Table({
  columns,
  rows
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            {columns.map((column) => (
              <th className="px-3 py-3 font-semibold" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-slate-200" key={index}>
              {row.map((cell, cellIndex) => (
                <td className="px-3 py-4 align-top text-slate-700" key={`${index}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
