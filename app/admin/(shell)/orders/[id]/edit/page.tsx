import { redirect } from "next/navigation"
import { OrderBuilder } from "@/components/order-builder"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  if (session.role !== "admin") redirect("/admin")

  const { id } = await params
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-primary">Edit proposal</h1>
      <OrderBuilder orderId={id} />
    </div>
  )
}
