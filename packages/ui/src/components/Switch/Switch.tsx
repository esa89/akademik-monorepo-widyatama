"use client";

import { HTMLAttributes } from "react";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
} & HTMLAttributes<HTMLButtonElement>;

const sizeConfig = {
  sm: {
    container: "w-8 h-4",
    knob: "w-3 h-3 translate-x-1",
    knobChecked: "translate-x-4",
  },
  md: {
    container: "w-10 h-5",
    knob: "w-4 h-4 translate-x-1",
    knobChecked: "translate-x-5",
  },
  lg: {
    container: "w-12 h-6",
    knob: "w-5 h-5 translate-x-1",
    knobChecked: "translate-x-6",
  },
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  className = "",
  ...props
}: SwitchProps) {
  const currentSize = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        relative inline-flex items-center transition-colors duration-200 ease-in-out rounded-full
        ${currentSize.container}
        ${disabled ? "bg-gray-300 cursor-not-allowed" : checked ? "bg-blue-600" : "bg-gray-300"}
        ${className}
      `}
      {...props}
    >
      <span
        className={`
          inline-block bg-white rounded-full shadow transform transition-transform duration-200
          ${currentSize.knob}
          ${checked ? currentSize.knobChecked : ""}
        `}
      />
    </button>
  );
}
