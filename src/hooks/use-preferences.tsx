"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_KEY = "fin-theme";
const PRIVACY_KEY = "fin-privacy";
const SIDEBAR_KEY = "fin-sidebar";

/**
 * Runs before first paint (inlined in <head>) so theme, privacy mask and
 * sidebar width never flash. `?theme=dark|light` overrides for QA.
 */
export const preferencesBootScript = `(function(){try{var d=document.documentElement;var q=new URLSearchParams(location.search).get('theme');var t=q||localStorage.getItem('${THEME_KEY}')||'system';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;if(localStorage.getItem('${PRIVACY_KEY}')==='on')d.dataset.privacy='on';if(localStorage.getItem('${SIDEBAR_KEY}')==='collapsed')d.dataset.sidebar='collapsed'}catch(e){document.documentElement.dataset.theme='light'}})();`;

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — preference lives for this session only */
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const systemTheme = (): ResolvedTheme => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

interface PreferencesValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  amountsHidden: boolean;
  toggleAmounts: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolved] = useState<ResolvedTheme>("light");
  const [amountsHidden, setHidden] = useState(false);
  const [sidebarCollapsed, setCollapsed] = useState(false);

  // Sync React state with what the boot script already applied.
  useEffect(() => {
    const root = document.documentElement;
    const stored = read(THEME_KEY) as ThemePreference | null;
    setThemeState(stored ?? "system");
    setResolved(root.dataset.theme === "dark" ? "dark" : "light");
    setHidden(root.dataset.privacy === "on");
    setCollapsed(root.dataset.sidebar === "collapsed");
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemTheme();
      document.documentElement.dataset.theme = next;
      setResolved(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    const resolved = next === "system" ? systemTheme() : next;
    document.documentElement.dataset.theme = resolved;
    store(THEME_KEY, next === "system" ? null : next);
    setThemeState(next);
    setResolved(resolved);
  }, []);

  const value = useMemo<PreferencesValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      amountsHidden,
      toggleAmounts: () => {
        const next = !amountsHidden;
        if (next) document.documentElement.dataset.privacy = "on";
        else delete document.documentElement.dataset.privacy;
        store(PRIVACY_KEY, next ? "on" : null);
        setHidden(next);
      },
      sidebarCollapsed,
      toggleSidebar: () => {
        const next = !sidebarCollapsed;
        if (next) document.documentElement.dataset.sidebar = "collapsed";
        else delete document.documentElement.dataset.sidebar;
        store(SIDEBAR_KEY, next ? "collapsed" : null);
        setCollapsed(next);
      },
    }),
    [theme, resolvedTheme, setTheme, amountsHidden, sidebarCollapsed],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
