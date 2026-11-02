import {
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  IdCard,
  ClipboardCheck,
  ClipboardList,
  Users,
  HeartPulse,
  TriangleAlert,
  UserCog,
  Building2,
  FolderCog,
} from "lucide-react";

import { can } from "@/lib/rbac";
import type { AccessSubject } from "@/lib/rbac";
import type { Permission } from "@/types";

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  action: ListChecks,
  risk: ShieldAlert,
  siap: IdCard,
  inspection: ClipboardCheck,
  audit: ClipboardList,
  meeting: Users,
  ftw: HeartPulse,
  incident: TriangleAlert,
  users: UserCog,
  departments: Building2,
  files: FolderCog,
};

export interface NavItem {
  label: string;
  href: string;
  icon: keyof typeof NAV_ICONS;
  group: string;
  permission?: Permission;
  planned?: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard / Home",
    href: "/dashboard",
    icon: "dashboard",
    group: "Utama",
  },
  {
    label: "Action Tracking",
    href: "/action-tracking",
    icon: "action",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "Risk Management",
    href: "/risk-management",
    icon: "risk",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "SIAP Card",
    href: "/siap-card",
    icon: "siap",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "HSSE Inspection",
    href: "/inspection",
    icon: "inspection",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "HSSE Audit",
    href: "/audit",
    icon: "audit",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "HSSE Meeting",
    href: "/meeting",
    icon: "meeting",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "Fit to Work",
    href: "/fit-to-work",
    icon: "ftw",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "Incident Management",
    href: "/incident",
    icon: "incident",
    group: "Operasional HSSE",
    planned: true,
  },
  {
    label: "Master User",
    href: "/users",
    icon: "users",
    group: "Administrasi",
    permission: "employees.read",
  },
  {
    label: "Roles",
    href: "/roles",
    icon: "risk",
    group: "Administrasi",
    permission: "roles.read",
  },
  {
    label: "Departments",
    href: "/departments",
    icon: "departments",
    group: "Administrasi",
    permission: "departments.read",
  },
  {
    label: "Permissions",
    href: "/permissions",
    icon: "files",
    group: "Administrasi",
    permission: "permissions.read",
  },
  {
    label: "Master File Management",
    href: "/files",
    icon: "files",
    group: "Administrasi",
    planned: true,
  },
];

export function getNavItems(
  user: AccessSubject | null | undefined,
) {
  if (!user?.isActive) return [];

  return DEFAULT_NAV_ITEMS.filter(
    (item) =>
      !item.planned &&
      (
        !item.permission ||
        can(user, item.permission)
      ),
  );
}
