"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import {
  Menu,
  Bell,
  ChevronDown,
  RefreshCw,
  LogOut,
  UserRound,
} from "lucide-react";

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

  async function exit() {
    try {
      const response = await fetch("/api/session/logout", { method: "POST" });

      if (!response.ok) {
        toast.warning("Sesi lokal ditutup; pencabutan token server gagal.");
      }
    } finally {
      await signOut({ callbackUrl: "/login" });
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

        <strong>
          {path === "/profile" ? "Profile" : current?.label || "HSSE"}
        </strong>
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

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="profile-button" aria-label="Buka menu akun">
              <span className="avatar small" aria-hidden="true">
                {user.image ? (
                  <img src={user.image} alt="" referrerPolicy="no-referrer" />
                ) : (
                  initials(user.name)
                )}
              </span>

              <span className="header-user">
                <strong>{user.name}</strong>
              </span>
              <ChevronDown size={15} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="profile-menu-content"
              align="end"
              sideOffset={10}
            >
              <div className="profile-menu-identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>

              <DropdownMenu.Separator className="profile-menu-separator" />

              <DropdownMenu.Item asChild>
                <Link className="profile-menu-item" href="/profile">
                  <UserRound size={18} />
                  Account Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="profile-menu-item danger"
                onSelect={() => void exit()}
              >
                <LogOut size={18} />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
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
    </header>
  );
}
