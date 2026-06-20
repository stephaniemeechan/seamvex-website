import { getSession } from "@/lib/auth/session"
import { SettingsClient } from "@/components/settings-client"
import { xeroConfig } from "@/lib/xero/client"
import { hasGmailRefreshToken } from "@/lib/gmail/client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string; xero?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  const sp = await searchParams
  const gmailConnected = await hasGmailRefreshToken(session.userId)
  return (
    <SettingsClient
      isAdmin={session.role === "admin"}
      xeroReady={Boolean(xeroConfig())}
      companyPhone={process.env.TWILIO_PHONE_NUMBER ?? null}
      gmailConnected={gmailConnected}
      gmailStatus={sp.gmail}
      xeroStatus={sp.xero}
    />
  )
}
