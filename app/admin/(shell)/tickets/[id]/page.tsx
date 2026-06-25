import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/get-session"
import { canManageContracts } from "@/lib/auth/rbac"
import { TicketDetailClient } from "@/components/ticket-detail-client"

export const dynamic = "force-dynamic"

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  const { id } = await params
  return <TicketDetailClient id={id} isAdmin={canManageContracts(session)} />
}
