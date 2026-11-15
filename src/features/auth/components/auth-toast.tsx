"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AuthToast() {
  useEffect(() => {
    const url = new URL(location.href);
    const signedOut = url.searchParams.get("signedOut");

    if (url.searchParams.get("loggedIn") === "1") {
      toast.success("Signed in successfully.", { position: "top-center" });
    } else if (url.searchParams.get("passwordChanged") === "1") {
      toast.success("Password changed. Please sign in again.", {
        position: "top-center",
      });
    } else if (signedOut === "partial") {
      toast.warning(
        "Local session closed, but the backend session could not be revoked.",
        { position: "top-center" },
      );
    } else if (signedOut === "1") {
      toast.success("Signed out successfully.", { position: "top-center" });
    } else {
      return;
    }

    url.searchParams.delete("loggedIn");
    url.searchParams.delete("passwordChanged");
    url.searchParams.delete("signedOut");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return null;
}
