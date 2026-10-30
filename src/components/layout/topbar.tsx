"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { Menu, Bell, ChevronDown, RefreshCw } from "lucide-react";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { UserDTO } from "@/features/users/types";

import { useUIStore } from "@/store/ui-store";
import { initials } from "@/lib/utils";
import { DEFAULT_NAV_ITEMS } from "@/config/nav";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ user }: { user: UserDTO }) {
  const path = usePathname();
  const { update } = useSession();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(false);
  const [profile, setProfile] = useState(false);

  const { collapsed, mobileOpen, toggle, setMobile } = useUIStore();

  function toggleNavigation() {
    if (window.matchMedia("(min-width: 1280px)").matches) toggle();
    else setMobile(!mobileOpen);
  }

  const current = DEFAULT_NAV_ITEMS.find(
    (item) => path === item.href || path.startsWith(item.href + "/"),
  );

  async function refreshAccess() {
    setBusy(true);

    try {
      const session = await update();

      if (!session || session.error) {
        throw new Error("Profil akses belum dapat diverifikasi");
      }

      toast.success("Profil dan akses diperbarui");
    } catch {
      toast.error("Akses belum dapat diperbarui. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-context">
        <button
          className="icon-btn hamburger"
          aria-label="Buka atau ringkas navigasi"
          aria-controls="primary-sidebar"
          aria-expanded={mobileOpen || !collapsed}
          onClick={toggleNavigation}
        >
          <Menu size={21} />
        </button>

        <span>Workspace</span>
        <span className="separator">/</span>

        <strong>{current?.label || "HSSE"}</strong>
      </div>

      <div className="topbar-tools">
        <ThemeToggle />

        <button
          className="icon-btn"
          aria-label="Perbarui akses"
          disabled={busy}
          onClick={() => void refreshAccess()}
        >
          <RefreshCw size={19} className={busy ? "spin" : ""} />
        </button>

        <button
          className="icon-btn"
          aria-label="Notifikasi"
          onClick={() => setNotice(true)}
        >
          <Bell size={20} />
        </button>

        <button
          className="profile-button"
          aria-label="Lihat profil"
          onClick={() => setProfile(true)}
        >
          <span className="avatar small">{initials(user.name)}</span>

          <span className="header-user">
            <strong>{user.name}</strong>
            <small>Akun {user.status}</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </div>

      <Dialog open={notice} onOpenChange={setNotice}>
        <DialogContent>
          <DialogTitle asChild>
            <h2>Notifikasi</h2>
          </DialogTitle>

          <DialogDescription>
            Layanan notifikasi belum dihubungkan.
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog open={profile} onOpenChange={setProfile}>
        <DialogContent>
          <DialogTitle asChild>
            <h2>{user.name}</h2>
          </DialogTitle>

          <DialogDescription>{user.email}</DialogDescription>

          <dl className="detail-dl">
            <dt>Status</dt>
            <dd>{user.status}</dd>

            <dt>Role ID</dt>
            <dd>{user.roleId ?? "Belum ditetapkan"}</dd>

            <dt>Department ID</dt>
            <dd>{user.departmentId ?? "Belum ditetapkan"}</dd>

            <dt>NIK</dt>
            <dd>{user.employeeId || "Belum tersedia"}</dd>
          </dl>

          <h3>Effective permissions</h3>

          {user.permissions.length ? (
            <ul>
              {user.permissions.map((permission) => (
                <li key={permission}>
                  <code>{permission}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada permission operasional.</p>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
