"use client";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="state">
      <AlertCircle />
      <h3>Data belum dapat dimuat</h3>
      <p>{message}</p>
      <Button variant="outline" onClick={retry}>
        Coba lagi
      </Button>
    </div>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="state">
      <Inbox />
      <h3>{message}</h3>
      <p>Coba ubah pencarian atau reset filter Anda.</p>
    </div>
  );
}
export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-wrap" role="status" aria-label="Memuat data">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
