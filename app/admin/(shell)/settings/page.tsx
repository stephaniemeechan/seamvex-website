import { getSession } from "@/lib/auth/session"
import { SettingsClient } from "@/components/settings-client"
import { xeroConfig } from "@/lib/xero/client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  return (
    <SettingsClient
      isAdmin={session.role === "admin"}
      xeroReady={Boolean(xeroConfig())}
      companyPhone={process.env.TWILIO_PHONE_NUMBER ?? null}
    />
  )
}
