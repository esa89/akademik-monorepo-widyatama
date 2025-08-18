import { ReactNode } from "react";

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "confirm" | "danger" | "success" | "info" | "form" | "promo" | "warning";
  showCloseIcon?: boolean;
  className?: string;
}

