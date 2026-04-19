"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import * as ReactDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  hideCloseButton?: boolean;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, hideCloseButton, wide }: ModalProps) {
  return (
    <ReactDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <ReactDialog.Portal>
        <ReactDialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <ReactDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "border-2 border-border bg-card text-card-foreground shadow-xl rounded",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            wide && "max-w-2xl",
          )}
        >
          {title ? (
            <ReactDialog.Title asChild>
              <h2 className="font-head text-lg px-4 py-3 border-b-2 border-border bg-primary text-primary-foreground flex items-center justify-between gap-3">
                <span>{title}</span>
                {!hideCloseButton && onClose && (
                  <ReactDialog.Close
                    className="border-2 border-border bg-card text-card-foreground p-1 rounded hover:bg-accent transition-colors"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </ReactDialog.Close>
                )}
              </h2>
            </ReactDialog.Title>
          ) : (
            <>
              <VisuallyHidden>
                <ReactDialog.Title>Dialog</ReactDialog.Title>
              </VisuallyHidden>
              {!hideCloseButton && onClose && (
                <ReactDialog.Close
                  className="absolute right-2 top-2 z-10 border-2 border-border bg-card text-card-foreground p-1 rounded hover:bg-accent transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </ReactDialog.Close>
              )}
            </>
          )}
          <div className="p-4 sm:p-5 max-h-[80vh] overflow-y-auto">{children}</div>
        </ReactDialog.Content>
      </ReactDialog.Portal>
    </ReactDialog.Root>
  );
}
