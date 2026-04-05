"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { inputClassName } from "@/components/ui/field";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
}

export function SearchableSelect({
  value,
  onChange,
  onBlur,
  onOptionSelect,
  options,
  placeholder,
  emptyMessage = "No matches found.",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onOptionSelect?: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) {
      return options.slice(0, 10);
    }
    return options
      .filter((option) =>
        [option.value, option.label, option.description, option.searchText]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      )
      .slice(0, 10);
  }, [options, value]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          className={cn(inputClassName("pr-11"), className)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
            onBlur?.();
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          value={value}
        />
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          {filteredOptions.length ? (
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredOptions.map((option) => (
                <button
                  className="flex w-full flex-col items-start rounded-[16px] px-3 py-3 text-left transition hover:bg-slate-100"
                  key={`${option.value}-${option.label}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(option.value);
                    onOptionSelect?.(option.value);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className="text-sm font-semibold text-ink">{option.label}</span>
                  {option.description ? (
                    <span className="mt-1 text-xs text-slate-500">{option.description}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
