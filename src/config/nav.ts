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
  BriefcaseBusiness,
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
  companies: Building2,
  jobPositions: BriefcaseBusiness,
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
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    group: "Home",
  },
  {
    label: "Action Tracking",
    href: "/action-tracking",
    icon: "action",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "Risk Management",
    href: "/risk-management",
    icon: "risk",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "SIAP Card",
    href: "/siap-card",
    icon: "siap",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "HSSE Inspection",
    href: "/inspection",
    icon: "inspection",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "HSSE Audit",
    href: "/audit",
    icon: "audit",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "HSSE Meeting",
    href: "/meeting",
    icon: "meeting",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "Fit to Work",
    href: "/fit-to-work",
    icon: "ftw",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "Incident Management",
    href: "/incident",
    icon: "incident",
    group: "Operational HSSE",
    planned: true,
  },
  {
    label: "Master User",
    href: "/users",
    icon: "users",
    group: "Administration",
    permission: "employees.read",
  },
  {
    label: "Roles",
    href: "/roles",
    icon: "risk",
    group: "Administration",
    permission: "roles.read",
  },
  {
    label: "Departments",
    href: "/departments",
    icon: "departments",
    group: "Administration",
    permission: "departments.read",
  },
  {
    label: "Companies",
    href: "/companies",
    icon: "companies",
    group: "Administration",
    permission: "companies.read",
  },
  {
    label: "Job Positions",
    href: "/job-positions",
    icon: "jobPositions",
    group: "Administration",
    permission: "job-positions.read",
  },
  {
    label: "Permissions",
    href: "/permissions",
    icon: "files",
    group: "Administration",
    permission: "permissions.read",
  },
  {
    label: "Master File Management",
    href: "/files",
    icon: "files",
    group: "Administration",
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
