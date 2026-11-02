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
        Memverifikasi akses…
      </main>
    );
  }

  if (!data || data.error || !data.user?.isActive) {
    return (
      <main className="boot">
        <h1>Akses belum dapat diverifikasi</h1>

        <p>
          Profil tidak tersedia atau sesi sudah berakhir. Konten dilindungi
          tidak ditampilkan.
        </p>

        <button
          className="btn btn-outline"
          onClick={() => void update().catch(() => undefined)}
        >
          Coba lagi
        </button>

        <button
          className="btn"
          onClick={() =>
            void signOut({
              callbackUrl: "/login",
            })
          }
        >
          Ke halaman login
        </button>
      </main>
    );
  }

  const user = data.user;

  return (
    <div className={cn("app-shell", collapsed && "is-collapsed")}>
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>

      <Sidebar user={user} />

      <div className="app-body">
        <Topbar user={user} />

        <main id="main-content" className="main-content">
          {children}
        </main>

        <footer className="app-footer">
          <span>HSSE · Dahboard bikinan pasya ganteng</span>

          <span>Keselamatan adalah tanggung jawab bersama.</span>
        </footer>
      </div>
    </div>
  );
}
