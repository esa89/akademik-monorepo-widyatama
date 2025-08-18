import React from "react";
import { clsx } from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "destructive-secondary" | "white" | "outline" | "ghost";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  iconLeft,
  iconRight,
  size = "md",
  className,
  children,
  ...props
}) => {
  const base = "inline-flex items-center font-normal rounded transition-all";

  const sizes = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-base px-4 py-2 gap-2",
    lg: "text-lg px-5 py-2.5 gap-2.5",
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-primary/10 text-primary hover:bg-primary/20",
    destructive: "bg-danger text-white hover:bg-danger/90",
    "destructive-secondary": "bg-danger/10 text-danger hover:bg-danger/20",
    white: "bg-white border border-primary/20 text-primary hover:bg-primary/5",
    outline: "border border-primary text-primary hover:bg-primary/5",
    ghost: "bg-transparent text-primary hover:bg-primary/5",
  };


  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className, props.disabled && "opacity-50 cursor-not-allowed",)}
      {...props}
    >
      {iconLeft && <span className="mr-1">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-1">{iconRight}</span>}
    </button>
  );
};
