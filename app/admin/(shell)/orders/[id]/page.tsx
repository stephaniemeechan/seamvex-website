import { OrderDetailClient } from "@/components/order-detail-client"
import { getSession } from "@/lib/auth/session"
import { canManageContracts } from "@/lib/auth/rbac"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  const { id } = await params
  return <OrderDetailClient id={id} canManageContracts={canManageContracts(session)} />
}
