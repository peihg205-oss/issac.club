'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Apply theme to document element
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }
  }, [])

  // On mount: check localStorage or system preference
  useEffect(() => {
    setMounted(true)
    try {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const paramTheme = urlParams?.get('theme') as Theme | null
      if (paramTheme === 'dark' || paramTheme === 'light') {
        setThemeState(paramTheme)
        applyTheme(paramTheme)
        return
      }

      const saved = localStorage.getItem('issac_theme') as Theme | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
        applyTheme(saved)
      } else {
        // Default to light as per club design, but respect system if dark
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initial = systemPrefersDark ? 'dark' : 'light'
        setThemeState(initial)
        applyTheme(initial)
      }
    } catch {
      applyTheme('light')
    }
  }, [applyTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    try {
      localStorage.setItem('issac_theme', newTheme)
    } catch {
      // ignore
    }
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
