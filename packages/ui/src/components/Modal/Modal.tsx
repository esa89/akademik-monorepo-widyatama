import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ModalProps } from "./Modal.types";
import { Button } from "../Button/Button";

const variantStyles: Record<string, string> = {
  default: "",
  confirm: "border border-yellow-300",
  danger: "border border-red-300",
  success: "border border-green-300",
  info: "border border-blue-300",
  warning: "border border-orange-300",
  form: "",
  promo: "",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = "default",
  showCloseIcon = true,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 z-40" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg p-6 space-y-4 ${variantStyles[variant]} ${className}`}
        >
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <Dialog.Title className="text-lg font-semibold">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            {showCloseIcon && (
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-800">
                  <X size={16} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div>{children}</div>

          {footer && (
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
