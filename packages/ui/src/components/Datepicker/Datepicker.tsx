"use client";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DatePickerProps = {
  label?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
};

export function DatePicker({ label, selected, onChange, className = "" }: DatePickerProps) {
  return (
    <div className={`w-full text-sm ${className}`}>
      {label && (
        <label className="mb-1 block font-medium text-gray-700">{label}</label>
      )}
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd MMMM yyyy"
        calendarClassName="border border-gray-200 rounded-md shadow-md p-2"
        wrapperClassName="relative z-50"
        popperClassName="z-50 mt-2"
        dayClassName={(date) => {
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selected?.toDateString() === date.toDateString();

          return [
            "w-8 h-8 flex items-center justify-center rounded-md text-sm",
            isToday ? "border border-blue-500" : "",
            isSelected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "hover:bg-blue-100 text-gray-800",
          ]
            .filter(Boolean)
            .join(" ");
        }}
        showPopperArrow={false}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </div>
  );
}
