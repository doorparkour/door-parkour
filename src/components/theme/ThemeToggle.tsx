"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  /** Use when toggle is on a dark brand background (teal) - keeps icon light */
  variant?: "on-dark" | "default";
}

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Toggle theme">
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";
  const iconClass = variant === "on-dark" ? "text-white" : "text-foreground";

  return (
    <Button
      variant={variant === "on-dark" ? "ghost" : "ghost"}
      size="icon"
      className={`h-9 w-9 shrink-0 ${variant === "on-dark" ? "text-white hover:bg-white/10 hover:text-white" : ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className={`h-4 w-4 ${variant === "on-dark" ? "" : iconClass}`} />
      ) : (
        <Moon className={`h-4 w-4 ${variant === "on-dark" ? "" : iconClass}`} />
      )}
    </Button>
  );
}
