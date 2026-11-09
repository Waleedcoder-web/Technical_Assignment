"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (DropdownOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  icon?: string;
  disabled?: boolean;
  name?: string;
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  icon,
  disabled = false,
  name,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to DropdownOption format
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      {/* Hidden input for form integrations if name is passed */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-xl border border-[#e7e8ea] hover:border-[#076a64]/50 focus:outline-none focus:ring-2 focus:ring-[#076a64]/20 focus:border-[#076a64] transition-all flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "border-[#076a64] bg-white ring-2 ring-[#076a64]/15 shadow-xs" : ""
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && (
            <span className="material-symbols-outlined text-[16px] text-[#076a64] shrink-0">
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="material-symbols-outlined text-[16px] text-[#076a64] shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate font-medium ${selectedOption ? "text-[#001637]" : "text-[#75777f]"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#a1f1e9] text-[#076a64] shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <span
          className={`material-symbols-outlined text-[18px] text-[#75777f] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#076a64]" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Custom Designed Dropdown Menu Box */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#e7e8ea] p-1.5 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          style={{ minWidth: "100%" }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-[#e6f7f6] text-[#076a64] font-bold shadow-2xs"
                    : "text-[#191c1e] hover:bg-[#f8f9fb] hover:text-[#076a64]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && (
                    <span
                      className={`material-symbols-outlined text-[15px] shrink-0 ${
                        isSelected ? "text-[#076a64]" : "text-[#75777f]"
                      }`}
                    >
                      {opt.icon}
                    </span>
                  )}
                  <div className="truncate">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block text-[10px] font-normal text-[#75777f] truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#a1f1e9]/60 text-[#076a64]">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-[#076a64]">
                      check
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
