import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type ComboboxOption = {
  label: string;
  value: string;
};

export type ComboboxProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  className?: string;
};

export function Combobox({
  label,
  placeholder = "Pilih opsi...",
  value,
  onChange,
  options,
  disabled = false,
  error = false,
  success = false,
  className = "", // ✅ default string kosong
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value);

  let borderColor = "border-gray-300 focus:ring-blue-500";
  if (error) {
    borderColor = "border-red-500 focus:ring-red-500";
  } else if (success) {
    borderColor = "border-green-500 focus:ring-green-500";
  }

  return (
    <div className={`w-full text-sm ${className}`}>
      {label && (
        <label className="mb-1 block text-gray-700 font-medium">{label}</label>
      )}
      <div className="relative">
        <button
          disabled={disabled}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full py-2 pl-3 pr-10 text-left bg-white rounded-md border ${borderColor} 
            focus:outline-none focus:ring-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
        >
          <span className={value ? "text-black" : "text-gray-400"}>
            {selected?.label || placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={16} className="text-gray-500" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${
                  option.value === value ? "bg-blue-50 text-blue-700" : ""
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
