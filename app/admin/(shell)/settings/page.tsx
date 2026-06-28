import { getSession } from "@/lib/auth/get-session"
import { SettingsClient } from "@/components/settings-client"
import { hasGmailRefreshToken } from "@/lib/gmail/client"
import { redirect } from "next/navigation"
import { isXeroConnected, getXeroTenantName, xeroConfig } from "@/lib/xero/client"

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
  const xeroConnected = await isXeroConnected()
  const xeroTenantName = xeroConnected ? await getXeroTenantName() : null
  return (
    <SettingsClient
      isAdmin={session.role === "admin"}
      xeroReady={Boolean(xeroConfig())}
      xeroConnected={xeroConnected}
      xeroTenantName={xeroTenantName}
      companyPhone={process.env.TWILIO_PHONE_NUMBER ?? null}
      gmailConnected={gmailConnected}
      gmailStatus={sp.gmail}
      xeroStatus={sp.xero}
    />
  )
}
