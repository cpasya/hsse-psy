"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { getNavItems, NAV_ICONS } from "@/config/nav";

import type { UserDTO } from "@/features/users/types";

import { initials, cn } from "@/lib/utils";

import { useUIStore } from "@/store/ui-store";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

export function Sidebar({ user }: { user: UserDTO }) {
  const path = usePathname();

  const { collapsed, mobileOpen, toggle, setMobile } = useUIStore();

  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const body = document.querySelector<HTMLElement>(".app-body");
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (body) body.inert = true;
    const focusables = () =>
      Array.from(
        asideRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    focusables()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobile(false);
      if (event.key === "Tab") {
        const items = focusables(),
          first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const media = window.matchMedia("(min-width: 1280px)");
    const resized = () => {
      if (media.matches) setMobile(false);
    };
    document.addEventListener("keydown", keydown);
    media.addEventListener("change", resized);
    return () => {
      document.body.style.overflow = oldOverflow;
      if (body) body.inert = false;
      document.removeEventListener("keydown", keydown);
      media.removeEventListener("change", resized);
      previous?.focus();
    };
  }, [mobileOpen, setMobile]);

  async function exit() {
    try {
      const response = await fetch("/api/session/logout", { method: "POST" });

      if (!response.ok) {
        toast.warning("Sesi lokal ditutup; pencabutan token server gagal.");
      }
    } finally {
      await signOut({
        callbackUrl: "/login",
      });
    }
  }

  return (
    <>
      {mobileOpen && (
        <button
          className="drawer-backdrop"
          aria-label="Tutup navigasi"
          onClick={() => setMobile(false)}
        />
      )}

      <aside
        id="primary-sidebar"
        ref={asideRef}
        className={cn("sidebar", mobileOpen && "mobile-open")}
        aria-label="Navigasi utama"
      >
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand" aria-label="HSSE Dashboard">
            <span className="brand-mark">
              <ShieldCheck size={25} />
            </span>

            <span className="nav-label">
              <strong>HSSE</strong>
              <small>K3, Keamanan & Lingkungan</small>
            </span>
          </Link>

          <button
            className="icon-btn mobile-close"
            aria-label="Tutup menu"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav>
          {["Utama", "Operasional HSSE", "Administrasi"].map((group) => {
            const items = getNavItems(user).filter(
              (item) => item.group === group,
            );

            if (!items.length) {
              return null;
            }

            return (
              <section className="nav-group" key={group}>
                <p className="nav-group-title">{group}</p>

                {items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];

                  const active =
                    path === item.href || path.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn("nav-item", active && "active")}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobile(false)}
                    >
                      <Icon size={19} />

                      <span className="nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </section>
            );
          })}
        </nav>

        <div className="sidebar-note nav-label">
          <ShieldCheck size={24} />
          <strong>Keselamatan untuk semua</strong>
          <p>Kelola pekerjaan dengan akses sesuai wewenang organisasi Anda.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">{initials(user.name)}</span>

            <span className="nav-label">
              <strong>{user.name}</strong>
              <small>Akun {user.status}</small>
            </span>
          </div>

          <button
            className="nav-item logout"
            aria-label="Keluar dari akun"
            onClick={exit}
          >
            <LogOut size={18} />

            <span className="nav-label">Keluar dari akun</span>
          </button>

          <button
            className="collapse-toggle"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <>
                <PanelLeftClose size={18} />
                <span>Ringkas navigasi</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
