"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { COOKIE_CONSENT_EVENT, COOKIE_CONSENT_KEY, LEGAL } from "@/lib/brand"

export type CookieConsentValue = "essential" | "analytics"

function readConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null
  const value = localStorage.getItem(COOKIE_CONSENT_KEY)
  if (value === "essential" || value === "analytics") return value
  return null
}

function writeConsent(value: CookieConsentValue) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readConsent() === null)
  }, [])

  useEffect(() => {
    const openSettings = () => setVisible(true)
    window.addEventListener("seamcor-open-cookie-settings", openSettings)
    return () => window.removeEventListener("seamcor-open-cookie-settings", openSettings)
  }, [])

  if (!visible) return null

  const acceptAnalytics = () => {
    writeConsent("analytics")
    setVisible(false)
  }

  const rejectNonEssential = () => {
    writeConsent("essential")
    setVisible(false)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:p-6"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h2 id="cookie-banner-title" className="text-base font-semibold text-primary">
            Cookies on this website
          </h2>
          <p id="cookie-banner-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We use essential cookies to remember your cookie choice. With your consent, we also use Vercel
            Analytics to understand how visitors use our site. You can accept analytics cookies, reject
            non-essential cookies, or read our{" "}
            <Link href={LEGAL.cookies} className="font-medium text-accent hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <button
            type="button"
            onClick={rejectNonEssential}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={acceptAnalytics}
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
          >
            Accept analytics cookies
          </button>
        </div>
      </div>
    </div>
  )
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("seamcor-open-cookie-settings"))}
    >
      Cookie settings
    </button>
  )
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === "analytics"
}
