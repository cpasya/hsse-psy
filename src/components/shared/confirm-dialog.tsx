"use client";
import * as Alert from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Alert.Root open={open} onOpenChange={onOpenChange}>
      <Alert.Portal>
        <Alert.Overlay className="modal-overlay" />
        <Alert.Content className="modal-content confirm">
          <Alert.Title asChild>
            <h2>{title}</h2>
          </Alert.Title>
          <Alert.Description className="muted">{description}</Alert.Description>
          <div className="dialog-actions">
            <Alert.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                Batal
              </Button>
            </Alert.Cancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Memproses…" : "Ya, lanjutkan"}
            </Button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}
