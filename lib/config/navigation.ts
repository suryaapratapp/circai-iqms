import {
  Boxes,
  ClipboardList,
  Gauge,
  History,
  MoreHorizontal,
  PackageSearch,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Search,
  Settings,
  UserCircle2,
  Wrench
} from "lucide-react";
import type { UserRole } from "@/lib/data/types";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof Gauge;
  roles: UserRole[];
}

interface MobileNavItem {
  href: string;
  label: string;
  icon: typeof Gauge;
}

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, roles: ["admin", "supervisor", "operator"] },
  { href: "/receive", label: "Receive", icon: PackagePlus, roles: ["admin", "supervisor", "operator"] },
  { href: "/search", label: "Search", icon: Search, roles: ["admin", "supervisor", "operator"] },
  { href: "/damage-item", label: "Damage Item", icon: PackageMinus, roles: ["admin", "supervisor", "operator"] },
  { href: "/repair-item", label: "Repair Item", icon: Wrench, roles: ["admin", "supervisor", "operator"] },
  { href: "/packing", label: "Pack Order", icon: PackageCheck, roles: ["admin", "supervisor", "operator"] },
  { href: "/unpack", label: "Unpack", icon: Boxes, roles: ["admin", "supervisor"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "supervisor"] },
  { href: "/packed-orders", label: "Packed Orders", icon: PackageSearch, roles: ["admin", "supervisor"] },
  { href: "/transaction-history", label: "Transaction History", icon: History, roles: ["admin", "supervisor"] },
  { href: "/reports", label: "Reports", icon: ClipboardList, roles: ["admin", "supervisor"] },
  { href: "/admin", label: "Settings / Admin", icon: Settings, roles: ["admin", "supervisor"] },
  { href: "/profile", label: "Profile", icon: UserCircle2, roles: ["admin", "supervisor", "operator"] }
];

export function getNavigationItemsForRole(role: UserRole) {
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function getMobilePrimaryNavForRole(role: UserRole) {
  const preferredRoutesByRole: Record<UserRole, string[]> = {
    admin: ["/receive", "/search", "/packing", "/inventory"],
    supervisor: ["/receive", "/search", "/packing", "/inventory"],
    operator: ["/receive", "/search", "/packing", "/repair-item"]
  };

  return getNavigationItemsForRole(role).filter((item) =>
    preferredRoutesByRole[role].includes(item.href)
  );
}

export function getMobileOverflowNavForRole(role: UserRole) {
  const primaryHrefs = new Set(getMobilePrimaryNavForRole(role).map((item) => item.href));
  return getNavigationItemsForRole(role).filter((item) => !primaryHrefs.has(item.href));
}

export function getMobileMoreNavItem(): MobileNavItem {
  return {
    href: "#mobile-more",
    label: "More",
    icon: MoreHorizontal
  };
}
