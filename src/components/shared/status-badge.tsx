import React from "react";
import { cn } from "@/lib/utils";
const tone: Record<string, string> = {
  active: "success",
  pending: "warning",
  disabled: "neutral",
  Aktif: "success",
  Nonaktif: "neutral",
  Closed: "success",
  Submitted: "info",
  "Under Review": "info",
  "In Investigation": "warning",
  "Needs Revision": "danger",
  Draft: "neutral",
  Open: "neutral",
  "In Progress": "info",
  "Pending Verification": "warning",
  Overdue: "danger",
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "success",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge", tone[status] || "neutral")}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

export function StatusBadgeTopBar({ status }: { status: string }) {
  return (
    <span className={cn("badge", tone[status] || "neutral")}>
      <span className="badge-dot" />
    </span>
  );
}