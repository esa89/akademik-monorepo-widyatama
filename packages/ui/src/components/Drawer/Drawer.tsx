import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          forceMount
          className={[
            "fixed inset-0 bg-black/40 z-40",
            open
              ? "animate-[overlay-in_200ms_ease] pointer-events-auto"
              : "animate-[overlay-out_200ms_ease] pointer-events-none opacity-0",
          ].join(" ")}
        />
        <Dialog.Content
          forceMount
          className={[
            "fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[480px] bg-white shadow-2xl",
            open
              ? "animate-[drawer-in_250ms_ease]"
              : "animate-[drawer-out_250ms_ease] translate-x-full",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-500 mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
