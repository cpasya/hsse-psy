"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const toastId = toast.loading("Signing out…", {
      position: "top-center",
    });
    let revoked = true;

    try {
      const response = await fetch("/api/session/logout", { method: "POST" });
      revoked = response.ok;
    } catch {
      revoked = false;
    }

    try {
      await signOut({ redirect: false });
      toast.dismiss(toastId);
      location.assign(`/login?signedOut=${revoked ? "1" : "partial"}`);
    } catch {
      toast.error("Could not close the local session. Try again.", {
        id: toastId,
        position: "top-center",
      });
      setIsLoggingOut(false);
    }
  }

  return { isLoggingOut, logout };
}
