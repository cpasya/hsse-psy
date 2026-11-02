import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { Forbidden } from "@/components/shared/module-placeholder";
import { UserDetailPage } from "@/features/users/components/user-detail-page";
import { requirePermission } from "@/lib/guards";

export const metadata = {
  title: "Detail User",
};

async function AuthorizedDetail({ employeeId }: { employeeId: string }) {
  const { allowed, session } = await requirePermission("employees.read");

  return allowed ? (
    <UserDetailPage employeeId={employeeId} currentUser={session.user} />
  ) : (
    <Forbidden />
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  return (
    <Suspense
      fallback={(
        <section
          className="card skeleton-wrap"
          role="status"
          aria-label="Memverifikasi akses detail user"
        >
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </section>
      )}
    >
      <AuthorizedDetail employeeId={id} />
    </Suspense>
  );
}
