"use client";

import { cn } from "@/lib/utils";
import { nextThemeMode } from "@/lib/theme-mode";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type Props = {
  compact?: boolean;
  className?: string;
};

export default function ThemeToggle({ compact = false, className }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !theme || theme === "light" || theme === "dark") return;
    setTheme(resolvedTheme === "dark" ? "dark" : "light");
  }, [mounted, resolvedTheme, setTheme, theme]);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-11 rounded-full border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.05]",
          compact ? "w-10" : "w-full sm:w-[190px]",
          className
        )}
      />
    );
  }

  const activeTheme =
    theme === "light" || theme === "dark"
      ? theme
      : resolvedTheme === "dark"
        ? "dark"
        : "light";

  if (compact) {
    const active = THEMES.find((item) => item.value === activeTheme) ?? THEMES[0];
    const Icon = active.icon;
    return (
      <button
        type="button"
        aria-label={`Theme: ${active.label}. Switch theme.`}
        onClick={() => setTheme(nextThemeMode(activeTheme))}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/85 text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:text-white",
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
        "grid w-full grid-cols-2 rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-inner dark:border-white/10 dark:bg-white/[0.05] sm:w-[190px]",
        className
      )}
      aria-label="Theme selector"
    >
      {THEMES.map((item) => {
        const Icon = item.icon;
        const active = activeTheme === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(item.value)}
            className={cn(
              "inline-flex min-w-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-all duration-200",
              active
                ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-violet-500/15 dark:text-white dark:ring-violet-400/25"
                : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
