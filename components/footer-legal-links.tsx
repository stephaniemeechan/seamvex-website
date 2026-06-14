"use client"

import Link from "next/link"
import { CookieSettingsLink } from "@/components/cookie-consent"
import { LEGAL } from "@/lib/brand"

export function FooterLegalLinks() {
  return (
    <ul className="mt-4 space-y-2 text-sm">
      <li>
        <Link href={LEGAL.privacy} className="text-primary-foreground/70 transition-colors hover:text-accent">
          Privacy Policy
        </Link>
      </li>
      <li>
        <Link href={LEGAL.cookies} className="text-primary-foreground/70 transition-colors hover:text-accent">
          Cookie Policy
        </Link>
      </li>
      <li>
        <Link href={LEGAL.terms} className="text-primary-foreground/70 transition-colors hover:text-accent">
          Website Terms of Use
        </Link>
      </li>
      <li>
        <CookieSettingsLink className="text-primary-foreground/70 transition-colors hover:text-accent" />
      </li>
    </ul>
  )
}
