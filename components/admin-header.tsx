"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LOGO } from "@/lib/brand"
import { csrfFetch } from "@/lib/api-client"
import type { SessionRole } from "@/lib/auth/session"

const NAV_BASE = [
  { href: "/admin", label: "Agreements", exact: true },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/settings", label: "Settings" },
] as const

const NAV_ADMIN = [
  { href: "/admin/orders/new", label: "New agreement" },
  { href: "/admin/resources", label: "Resources" },
] as const

export function AdminHeader({ role }: { role?: SessionRole | null }) {
  const pathname = usePathname()
  const isAdmin = role === "admin"
  const nav = isAdmin ? [...NAV_BASE, ...NAV_ADMIN] : NAV_BASE

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-4">
            <Image
              src={LOGO.marketing.src}
              alt={LOGO.marketing.alt}
              width={LOGO.marketing.width}
              height={LOGO.marketing.height}
              className="h-12 w-auto"
            />
            <span className="text-sm font-semibold text-primary">Seamcor Admin</span>
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={async (e) => {
                e.preventDefault()
                await csrfFetch("/api/auth/logout", { method: "POST" })
                window.location.href = "/admin/login"
              }}
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                isActive(item.href, "exact" in item ? item.exact : false)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
