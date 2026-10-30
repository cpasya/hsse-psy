import { create } from "zustand";
interface UIState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setMobile: (open: boolean) => void;
}
export const useUIStore = create<UIState>((set) => ({
  collapsed: false,
  mobileOpen: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  setMobile: (mobileOpen) => set({ mobileOpen }),
}));
