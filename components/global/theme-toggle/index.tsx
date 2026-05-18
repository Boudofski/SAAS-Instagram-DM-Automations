"use client";

import { cn } from "@/lib/utils";
import { nextThemeMode } from "@/lib/theme-mode";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type Props = {
  compact?: boolean;
  className?: string;
};

export default function ThemeToggle({ compact = false, className }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-10 rounded-full border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]",
          compact ? "w-10" : "w-[184px]",
          className
        )}
      />
    );
  }

  if (compact) {
    const active = THEMES.find((item) => item.value === theme) ?? THEMES[2];
    const Icon = active.icon;
    return (
      <button
        type="button"
        aria-label={`Theme: ${active.label}. Switch theme.`}
        onClick={() => setTheme(nextThemeMode(theme))}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-pink-200 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:text-white",
          className
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.05]",
        className
      )}
      aria-label="Theme selector"
    >
      {THEMES.map((item) => {
        const Icon = item.icon;
        const active = theme === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
              active
                ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
