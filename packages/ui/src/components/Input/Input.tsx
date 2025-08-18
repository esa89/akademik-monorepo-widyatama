import React from "react";
import { clsx } from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  disabled,
  className,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 text-sm w-full">
      {label && (
        <label className={clsx("text-gray-700 font-medium", disabled && "opacity-60")}>
          {label}
        </label>
      )}
      <input
        disabled={disabled}
        className={clsx(
          "px-3 py-2 border rounded-md text-sm transition-all placeholder-gray-400",
          "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
          disabled && "bg-gray-100 text-gray-400 cursor-not-allowed",
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
};
