"use client"

import { Analytics } from "@vercel/analytics/react"
import { useEffect, useState } from "react"
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY } from "@/lib/brand"

export function ConsentGatedAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => {
      setEnabled(localStorage.getItem(COOKIE_CONSENT_KEY) === "analytics")
    }
    sync()
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
  }, [])

  if (!enabled) return null
  return <Analytics />
}
