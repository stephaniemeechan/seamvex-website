import { Suspense } from "react"
import { passwordLoginAllowed } from "@/lib/env"
import AdminLoginForm from "./login-form"

export default function AdminLoginPage() {
  const showPasswordLogin = passwordLoginAllowed()

  return (
    <Suspense fallback={<LoginFallback />}>
      <AdminLoginForm showPasswordLogin={showPasswordLogin} />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
