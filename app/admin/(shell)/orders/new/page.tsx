import { redirect } from "next/navigation"
import { OrderBuilder } from "@/components/order-builder"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function NewOrderPage() {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  if (session.role !== "admin") redirect("/admin")

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New agreement</h1>
      <p className="mt-1 text-muted-foreground">Build a proposal from catalogue defaults — all prices editable.</p>
      <div className="mt-6">
        <OrderBuilder />
      </div>
    </div>
  )
}
