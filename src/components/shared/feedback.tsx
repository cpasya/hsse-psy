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
      <h3>Data could not be loaded</h3>
      <p>{message}</p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="state">
      <Inbox />
      <h3>{message}</h3>
      <p>Try changing your search or resetting the filters.</p>
    </div>
  );
}
export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-wrap" role="status" aria-label="Loading data">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
