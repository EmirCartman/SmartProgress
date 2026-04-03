import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors as baseColors } from "../constants/theme";

const THEME_STORAGE_KEY = "@smartprogress_theme_accent";

// Default accent is the lime green
const DEFAULT_ACCENT = "#CCFF00";

// Helper to adjust hex color brightness or opacity
const hexToRgb = (hex: string) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const hexFull = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexFull);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Helper to darken a hex color by a percentage (0-1)
const darkenHex = (hex: string, amount: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));
    
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
};

export const generateColors = (accentHex: string) => {
    const rgb = hexToRgb(accentHex);
    let accentMuted = "rgba(204, 255, 0, 0.15)"; // Default fallback
    
    if (rgb) {
        accentMuted = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
    }
    
    const accentDark = darkenHex(accentHex, 0.2); // 20% darker
    
    return {
        ...baseColors,
        accent: accentHex,
        accentDark,
        accentMuted,
    };
};

type ThemeContextType = {
    colors: ReturnType<typeof generateColors>;
    setAccentColor: (color: string) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedAccent = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (storedAccent) {
                    setAccentColorState(storedAccent);
                }
            } catch (error) {
                console.error("Failed to load theme color from storage", error);
            }
        };
        loadTheme();
    }, []);

    const setAccentColor = async (color: string) => {
        setAccentColorState(color);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, color);
        } catch (error) {
            console.error("Failed to save theme color to storage", error);
        }
    };

    const currentColors = generateColors(accentColor);

    return (
        <ThemeContext.Provider value={{ colors: currentColors, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Provide a fallback so it doesn't crash if used outside provider by mistake during dev
        return { colors: generateColors(DEFAULT_ACCENT), setAccentColor: async () => {} };
    }
    return context;
};
