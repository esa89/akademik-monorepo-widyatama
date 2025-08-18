import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className = "", ...props }: CardProps) => {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  );
};
