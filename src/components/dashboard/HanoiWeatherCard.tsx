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

// Fallback data for Hanoi if network is offline or loading
const FALLBACK_WEATHER: HanoiWeatherData = {
  currentTemp: 28,
  tempMax: 29,
  tempMin: 23,
  weatherCode: 51, // light drizzle / cloudy
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
    text: lang === 'vi' ? 'Nắng nhẹ' : 'Sunny',
    Icon: Sun,
  }
}

const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const EN_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function HanoiWeatherCard() {
  const { language } = useLanguage()
  const [weatherData, setWeatherData] = useState<HanoiWeatherData>(FALLBACK_WEATHER)
  const [timeState, setTimeState] = useState({
    hourMin: '12:00',
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
  const [isSunsetTheme, setIsSunsetTheme] = useState(false)

  return (
    <div
      className={`weather-widget ${isSunsetTheme ? 'weather-sunset' : ''}`}
      title={
        language === 'vi'
          ? `Thời tiết Hà Nội hôm nay: ${activeWeather.text}, ${activeWeather.temp} (Cao/Thấp: ${activeWeather.range}). Bấm vào địa điểm để đổi giao diện màu!`
          : `Hanoi Weather today: ${activeWeather.text}, ${activeWeather.temp} (High/Low: ${activeWeather.range}). Click location to toggle theme color!`
      }
    >
      {/* Background with artistic sun circles (From Uiverse.io by KSAplay) */}
      <div className="background-design" aria-hidden="true">
        <div className="circle" />
        <div className="circle" />
        <div className="circle" />
      </div>

      {/* Info Section (Top 72%) */}
      <div className="info-section">
        {/* Left Side: Weather Icon + Text + Temperature */}
        <div className="left-side">
          <div className="weather-condition">
            <WeatherIcon className="w-3.5 h-3.5 shrink-0 text-white drop-shadow-xs" />
            <span className="truncate max-w-[110px]">{activeWeather.text}</span>
          </div>

          <div className="temperature">{activeWeather.temp}</div>

          <div className="temp-range">{activeWeather.range}</div>
        </div>

        {/* Right Side: Real-time Hanoi Clock + Date + Location */}
        <div className="right-side">
          <div className="hour">{timeState.hourMin}</div>
          <div className="date-text">{timeState.dateText}</div>
          <button
            type="button"
            onClick={() => setIsSunsetTheme(!isSunsetTheme)}
            className="location-text hover:opacity-80 transition cursor-pointer"
            title="Đổi tông màu Trời Xanh / Hoàng Hôn"
          >
            <MapPin className="w-2.5 h-2.5 shrink-0 text-yellow-300" />
            <span>{language === 'vi' ? 'Hà Nội' : 'Hanoi'}</span>
          </button>
        </div>
      </div>

      {/* Days Section (Bottom 25%): 4-day forecast */}
      <div className="days-section">
        {weatherData.daily.map((day, idx) => {
          const dayMeta = getWeatherMeta(day.code, language)
          const DayIcon = dayMeta.Icon
          const isSelected = selectedDayIdx === idx

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDayIdx(isSelected ? null : idx)}
              className={isSelected ? '!bg-[#1A3E94] !scale-95' : ''}
              title={`${day.dayLabel}: ${dayMeta.text} (${day.tempMax}°/${day.tempMin}°)`}
            >
              <span className="day">{day.dayLabel}</span>
              <span className="icon-weather-day">
                <DayIcon className="w-3 h-3 text-white/95" />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
