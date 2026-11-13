"use client";

import { useSession, signOut } from "next-auth/react";

import type { UserDTO } from "@/features/users/types";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
}: {
  user: UserDTO;
  children: React.ReactNode;
}) {
  const collapsed = useUIStore((state) => state.collapsed);

  const { data, status, update } = useSession();

  if (status === "loading") {
    return (
      <main className="boot" role="status">
        Verifying access…
      </main>
    );
  }

  if (!data || data.error || !data.user?.isActive) {
    return (
      <main className="boot">
        <h1>Access could not be verified</h1>

        <p>
          The profile is unavailable or the session has expired. Protected
          content is not displayed.
        </p>

        <button
          className="btn btn-outline"
          onClick={() => void update().catch(() => undefined)}
        >
          Try again
        </button>

        <button
          className="btn"
          onClick={() =>
            void signOut({
              callbackUrl: "/login",
            })
          }
        >
          Go to login
        </button>
      </main>
    );
  }

  const user = data.user;

  return (
    <div className={cn("app-shell", collapsed && "is-collapsed")}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar user={user} />

      <div className="app-body">
        <Topbar user={user} />

        <main id="main-content" className="main-content">
          {children}
        </main>

        <footer className="app-footer">
          <span>HSSE · Management Dashboard</span>

          <span>Safety is a shared responsibility.</span>
        </footer>
      </div>
    </div>
  );
}
