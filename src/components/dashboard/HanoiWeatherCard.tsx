'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  MapPin,
} from 'lucide-react'
import { useLanguage } from '@/lib/context/LanguageContext'

interface WeatherDayForecast {
  date: string
  dayLabel: string
  code: number
  tempMax: number
  tempMin: number
}

interface HanoiWeatherData {
  currentTemp: number
  tempMax: number
  tempMin: number
  weatherCode: number
  daily: WeatherDayForecast[]
}

// Fallback data for Hanoi if network is offline or loading (matching user's reference)
const FALLBACK_WEATHER: HanoiWeatherData = {
  currentTemp: 31,
  tempMax: 31,
  tempMin: 24,
  weatherCode: 51, // Mưa phùn / Drizzle
  daily: [
    { date: '2026-11-04', dayLabel: 'T4', code: 51, tempMax: 31, tempMin: 24 },
    { date: '2026-11-05', dayLabel: 'T5', code: 53, tempMax: 31, tempMin: 25 },
    { date: '2026-11-06', dayLabel: 'T6', code: 95, tempMax: 30, tempMin: 23 },
    { date: '2026-11-07', dayLabel: 'T7', code: 51, tempMax: 30, tempMin: 23 },
  ],
}

function getWeatherMeta(code: number, lang: 'vi' | 'en') {
  if (code === 0) {
    return {
      text: lang === 'vi' ? 'Trời quang' : 'Sunny',
      Icon: Sun,
    }
  }
  if (code === 1 || code === 2) {
    return {
      text: lang === 'vi' ? 'Ít mây' : 'Partly Cloudy',
      Icon: CloudSun,
    }
  }
  if (code === 3) {
    return {
      text: lang === 'vi' ? 'Nhiều mây' : 'Overcast',
      Icon: Cloud,
    }
  }
  if (code === 45 || code === 48) {
    return {
      text: lang === 'vi' ? 'Sương mù' : 'Foggy',
      Icon: CloudFog,
    }
  }
  if (code >= 51 && code <= 57) {
    return {
      text: lang === 'vi' ? 'Mưa phùn' : 'Drizzle',
      Icon: CloudDrizzle,
    }
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      text: lang === 'vi' ? 'Mưa rào' : 'Rainy',
      Icon: CloudRain,
    }
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      text: lang === 'vi' ? 'Có tuyết' : 'Snow',
      Icon: Snowflake,
    }
  }
  if (code >= 95) {
    return {
      text: lang === 'vi' ? 'Có dông' : 'Thunderstorm',
      Icon: CloudLightning,
    }
  }
  return {
    text: lang === 'vi' ? 'Mưa phùn' : 'Drizzle',
    Icon: CloudDrizzle,
  }
}

const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const EN_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function HanoiWeatherCard() {
  const { language } = useLanguage()
  const [weatherData, setWeatherData] = useState<HanoiWeatherData>(FALLBACK_WEATHER)
  const [timeState, setTimeState] = useState({
    hourMin: '13:27',
    dateText: 'T3 03/11',
  })
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null)

  // Real-time Hanoi Clock (updated every second)
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      // Hour:Minute in Hanoi time (GMT+7)
      const hourMin = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      // Hanoi date parts
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now)
      const month = parts.find((p) => p.type === 'month')?.value || '11'
      const day = parts.find((p) => p.type === 'day')?.value || '03'

      const hanoiDateObj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
      const dayOfWeekIdx = hanoiDateObj.getDay()

      const dateText =
        language === 'vi'
          ? `${VI_DAYS[dayOfWeekIdx]} ${day}/${month}`
          : `${EN_DAYS[dayOfWeekIdx]} ${month}-${day}`

      setTimeState({ hourMin, dateText })
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [language])

  // Fetch real-time weather from Open-Meteo for Hanoi
  useEffect(() => {
    let isMounted = true

    async function fetchHanoiWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok'
        )
        if (!res.ok) return
        const data = await res.json()

        if (!data?.current || !data?.daily || !isMounted) return

        const currentTemp = Math.round(data.current.temperature_2m)
        const weatherCode = data.current.weather_code
        const tempMax = Math.round(data.daily.temperature_2m_max?.[0] ?? currentTemp)
        const tempMin = Math.round(data.daily.temperature_2m_min?.[0] ?? currentTemp)

        // Take next 4 days (index 1 to 4)
        const dailyList: WeatherDayForecast[] = []
        for (let i = 1; i <= 4; i++) {
          const dateStr = data.daily.time?.[i]
          if (!dateStr) break
          const code = data.daily.weather_code?.[i] ?? 0
          const tMax = Math.round(data.daily.temperature_2m_max?.[i] ?? 30)
          const tMin = Math.round(data.daily.temperature_2m_min?.[i] ?? 23)

          const dObj = new Date(dateStr + 'T00:00:00+07:00')
          const dIdx = dObj.getDay()
          const dayLabel = language === 'vi' ? VI_DAYS[dIdx] : EN_DAYS[dIdx]

          dailyList.push({
            date: dateStr,
            dayLabel,
            code,
            tempMax: tMax,
            tempMin: tMin,
          })
        }

        setWeatherData({
          currentTemp,
          tempMax,
          tempMin,
          weatherCode,
          daily: dailyList,
        })
      } catch (err) {
        // Silently preserve fallback data
        console.warn('Weather fetch error:', err)
      }
    }

    fetchHanoiWeather()
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchHanoiWeather, 15 * 60 * 1000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [language])

  // Current weather info
  const activeWeather = useMemo(() => {
    if (selectedDayIdx !== null && weatherData.daily[selectedDayIdx]) {
      const day = weatherData.daily[selectedDayIdx]
      const meta = getWeatherMeta(day.code, language)
      return {
        temp: `${day.tempMax}°`,
        range: `${day.tempMax}°/${day.tempMin}°`,
        text: meta.text,
        Icon: meta.Icon,
        label: day.dayLabel,
      }
    }
    const meta = getWeatherMeta(weatherData.weatherCode, language)
    return {
      temp: `${weatherData.currentTemp}°`,
      range: `${weatherData.tempMax}°/${weatherData.tempMin}°`,
      text: meta.text,
      Icon: meta.Icon,
      label: null,
    }
  }, [selectedDayIdx, weatherData, language])

  const WeatherIcon = activeWeather.Icon

  return (
    <div
      className="weather-widget"
      title={
        language === 'vi'
          ? `Thời tiết Hà Nội: ${activeWeather.text}, ${activeWeather.temp} (${activeWeather.range})`
          : `Hanoi Weather: ${activeWeather.text}, ${activeWeather.temp} (${activeWeather.range})`
      }
    >
      {/* Background with artistic sky waves matching user's image (Vector SVG) */}
      <div className="background-design" aria-hidden="true">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 252 125"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Light Mode Gradients matching user's image */}
            <linearGradient id="skyGradLight" x1="0" y1="0" x2="252" y2="125" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#359CEB" />
              <stop offset="42%" stopColor="#4FB1F6" />
              <stop offset="100%" stopColor="#87CDF8" />
            </linearGradient>
            <linearGradient id="arc1GradLight" x1="112" y1="0" x2="252" y2="89" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A2DFFD" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#C6EAFE" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="arc2GradLight" x1="145" y1="0" x2="252" y2="89" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DCF2FE" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#EBF7FE" stopOpacity="1" />
            </linearGradient>

            {/* Dark Mode Gradients */}
            <linearGradient id="skyGradDark" x1="0" y1="0" x2="252" y2="125" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B2547" />
              <stop offset="45%" stopColor="#123869" />
              <stop offset="100%" stopColor="#184C8C" />
            </linearGradient>
            <linearGradient id="arc1GradDark" x1="112" y1="0" x2="252" y2="89" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1A4980" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#2460A6" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="arc2GradDark" x1="145" y1="0" x2="252" y2="89" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1F5394" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2969B5" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Base Azure Sky */}
          <rect width="252" height="125" className="fill-sky-base" />

          {/* Concentric Arc 1: Middle Light Cyan Wave */}
          <path
            d="M 112 0 C 118 34, 136 64, 162 89 L 252 89 L 252 0 Z"
            className="fill-sky-arc1"
          />

          {/* Concentric Arc 2: Inner Pale Ice-Blue Wave behind the Clock */}
          <path
            d="M 145 0 C 158 34, 180 64, 212 89 L 252 89 L 252 0 Z"
            className="fill-sky-arc2"
          />
        </svg>
      </div>

      {/* Info Section (Top 71%) */}
      <div className="info-section">
        {/* Left Side: White Weather icon + Text + Big Temperature */}
        <div className="left-side">
          <div className="weather-condition">
            <WeatherIcon className="w-3.5 h-3.5 shrink-0 text-white" />
            <span className="truncate max-w-[110px]">{activeWeather.text}</span>
          </div>

          <div className="temperature">{activeWeather.temp}</div>

          <div className="temp-range">{activeWeather.range}</div>
        </div>

        {/* Right Side: Dark Navy Hour + Date + Location with Yellow Pin */}
        <div className="right-side">
          <div className="hour">{timeState.hourMin}</div>
          <div className="date-text">{timeState.dateText}</div>
          <div className="location-text">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#EAB308] stroke-[2.5]" />
            <span>{language === 'vi' ? 'Hà Nội' : 'Hanoi'}</span>
          </div>
        </div>
      </div>

      {/* Days Section (Bottom 29%): 4-day forecast matching user's exact style */}
      <div className="days-section">
        {weatherData.daily.map((day, idx) => {
          const dayMeta = getWeatherMeta(day.code, language)
          const DayIcon = dayMeta.Icon
          // Default first day (idx === 0) is active as in user's image, unless clicked
          const isSelected = selectedDayIdx === null ? idx === 0 : selectedDayIdx === idx
          const showDivider = idx < weatherData.daily.length - 1

          return (
            <div key={day.date} className={`day-slot ${showDivider ? 'has-divider' : ''}`}>
              <button
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`day-pill ${isSelected ? 'is-active' : ''}`}
                title={`${day.dayLabel}: ${dayMeta.text} (${day.tempMax}°/${day.tempMin}°)`}
              >
                <span className="day-label">{day.dayLabel}</span>
                <span className="day-icon">
                  <DayIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
