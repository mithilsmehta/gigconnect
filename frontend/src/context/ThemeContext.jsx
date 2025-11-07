import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();

const THEMES = {
    a: { id: "a", name: "Clean Green", className: "theme-a" },
    b: { id: "b", name: "Purple Gradient", className: "theme-b" },
    c: { id: "c", name: "Dark Neon", className: "theme-c" },
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem("gc_theme") || "a");

    useEffect(() => {
        localStorage.setItem("gc_theme", theme);
        document.documentElement.classList.remove("theme-a", "theme-b", "theme-c");
        document.documentElement.classList.add(THEMES[theme]?.className || "theme-a");
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme, THEMES }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);