import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ThemeColors {
    primary: string;
    background: string;
    overlay: string;
}

interface ThemeContextType {
    theme: ThemeColors;
    setThemeFromImage: (imageUrl: string | null) => void;
    resetTheme: () => void;
}

const defaultTheme: ThemeColors = {
    primary: "#9333ea", // Purple-600
    background: "#111827", // Gray-900
    overlay: "rgba(0,0,0,0.7)"
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

import { analyzeImage } from "../utils/analyzeImage";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeColors>(defaultTheme);

    const setThemeFromImage = async (imageUrl: string | null) => {
        if (!imageUrl) {
            setTheme(defaultTheme);
            return;
        }

        try {
            const palette = await analyzeImage(imageUrl);
            if (palette) {
                setTheme({
                    primary: palette.primary,
                    background: palette.background,
                    overlay: `linear-gradient(to bottom, rgba(${palette.background.match(/\d+/g)?.join(',')}, 0.8), rgba(0,0,0,0.95))`
                });
            }
        } catch (e) {
            console.error("Failed to extract theme:", e);
        }
    };

    const resetTheme = () => setTheme(defaultTheme);

    // Apply to CSS variables for global usage (optional)
    useEffect(() => {
        document.documentElement.style.setProperty('--app-primary', theme.primary);
        document.documentElement.style.setProperty('--app-bg', theme.background);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setThemeFromImage, resetTheme }}>
            <div
                style={{
                    backgroundColor: theme.background,
                    transition: "background-color 1s ease, color 0.5s ease"
                }}
                className="min-h-screen text-white transition-colors duration-1000"
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
