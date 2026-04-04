"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[18px] px-4 py-3 text-sm font-semibold transition duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-teal text-white shadow-[0_16px_30px_rgba(29,78,216,0.22)] hover:bg-pine",
        variant === "secondary" &&
          "border border-blue-100 bg-blue-50 text-teal hover:bg-blue-100",
        variant === "ghost" &&
          "border border-slate-200 bg-white/90 text-ink hover:border-blue-100 hover:bg-blue-50/80",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className
      )}
      type={type}
      {...props}
    />
  );
}
