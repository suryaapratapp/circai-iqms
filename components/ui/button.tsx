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
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-ink text-white shadow-warehouse hover:bg-slate-800",
        variant === "secondary" &&
          "bg-teal/10 text-teal hover:bg-teal/15",
        variant === "ghost" && "bg-white/70 text-ink hover:bg-white",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className
      )}
      type={type}
      {...props}
    />
  );
}
