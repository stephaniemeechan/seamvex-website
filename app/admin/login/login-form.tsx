"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { LOGO } from "@/lib/brand"

const ERROR_MESSAGES: Record<string, string> = {
  oauth_state: "Sign-in could not be verified. Please try again.",
  domain: "Only @seamvex.com Google accounts can sign in.",
  inactive: "Your account is inactive. Contact an administrator.",
  oauth_failed: "Google sign-in failed. Please try again.",
}

type Props = {
  showPasswordLogin: boolean
}

export default function AdminLoginForm({ showPasswordLogin }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error")
  const [email, setEmail] = useState("s.meechan@seamvex.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      setError("Invalid email or password")
      return
    }
    router.push("/admin")
  }

  const displayError = error || (oauthError ? ERROR_MESSAGES[oauthError] ?? "Sign-in failed" : "")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Image
          src={LOGO.marketing.src}
          alt={LOGO.marketing.alt}
          width={LOGO.marketing.width}
          height={LOGO.marketing.height}
          className="mx-auto h-14 w-auto"
        />
        <h1 className="mt-6 text-center text-xl font-bold text-primary">Admin sign in</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Agreements tool — sign in with your Seamvex Google account
        </p>

        <a
          href="/api/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        {showPasswordLogin && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Dev login</span>
              </div>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-primary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                Sign in
              </button>
            </form>
          </>
        )}

        {displayError && <p className="mt-4 text-sm text-destructive">{displayError}</p>}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
