"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border-2 border-ink bg-white p-1 shadow-hard-sm",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-bold tracking-tight transition-colors",
            value === o.value
              ? "bg-ink text-white"
              : "text-ink hover:bg-black/5",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
