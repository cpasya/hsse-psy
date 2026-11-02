"use client";

import {
  SessionProvider as Provider,
  useSession,
} from "next-auth/react";
import type { Session } from "next-auth";

import {
  useEffect,
  useRef,
} from "react";

import { useRouter } from "next/navigation";

function AccessSync() {
  const { data, status } = useSession();

  const router = useRouter();
  const previous = useRef<string>();

  // Jangan menyertakan expires session:
  // nilainya dapat berubah meskipun akses tidak berubah.
  const key = JSON.stringify({
    status,
    error: data?.error,
    user: data?.user,
  });

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (previous.current === undefined) {
      previous.current = key;
      return;
    }

    if (previous.current !== key) {
      previous.current = key;
      router.refresh();
    }
  }, [key, status, router]);

  return null;
}

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <Provider
      session={session}
      refetchInterval={60}
      refetchOnWindowFocus
      refetchWhenOffline={false}
    >
      <AccessSync />
      {children}
    </Provider>
  );
}
