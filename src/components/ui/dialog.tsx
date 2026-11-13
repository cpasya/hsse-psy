"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export const DialogClose = Primitive.Close;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.Content> { }

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="modal-overlay" />
    <Primitive.Content
      ref={ref}
      className={cn("modal-content", className)}
      {...props}
    >
      {children}
      <Primitive.Close
        className="icon-btn modal-close"
        aria-label="Close dialog"
      >
        <X size={20} />
      </Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("dialog-header", className)}
      {...props}
    />
  );
}

