'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '@/lib/context/ThemeContext'
import { useLanguage } from '@/lib/context/LanguageContext'

interface ThemeSwitchProps {
  className?: string
  size?: 'sm' | 'md'
}

export function ThemeSwitch({ className = '', size = 'md' }: ThemeSwitchProps) {
  const { theme, toggleTheme } = useTheme()
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // In this switch design:
  // Checked (true)  => Day / Light mode (sky blue, bright sun, white cloud)
  // Unchecked (false) => Night / Dark mode (dark sky, crescent moon, stars)
  const isChecked = mounted ? theme === 'light' : true

  const tooltipText =
    language === 'vi'
      ? theme === 'dark'
        ? 'Chuyển sang giao diện Sáng'
        : 'Chuyển sang giao diện Tối'
      : theme === 'dark'
      ? 'Switch to Light mode'
      : 'Switch to Dark mode'

  const sizeClass = size === 'sm' ? 'text-[11px]' : 'text-[12.5px] sm:text-[13px]'

  return (
    <label
      className={`theme-switch switch ${sizeClass} ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={toggleTheme}
        aria-label="Toggle light / dark mode"
      />
      <span className="slider">
        <span className="star star_1" />
        <span className="star star_2" />
        <span className="star star_3" />
        <svg
          viewBox="0 0 16 16"
          className="cloud cloud_1"
          aria-hidden="true"
        >
          <path
            transform="matrix(.77976 0 0 .78395-299.99-418.63)"
            fill="#ffffff"
            d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
          />
        </svg>
      </span>
    </label>
  )
}
