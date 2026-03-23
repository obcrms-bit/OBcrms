"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ThemeContextType = {
    theme: any;
    setTheme: (theme: any) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<any>({
        primaryColor: '#4f46e5',
        secondaryColor: '#1e293b',
        logoUrl: '',
        companyName: 'Trust CRM',
    });
    const value = useMemo(() => ({ theme, setTheme }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
}