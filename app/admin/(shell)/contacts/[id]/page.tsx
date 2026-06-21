import { ContactDetailClient } from "@/components/contact-detail-client"
import { getSession } from "@/lib/auth/get-session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect("/admin/login")

  const { id } = await params
  const companyPhone = process.env.TWILIO_PHONE_NUMBER ?? null
  return (
    <ContactDetailClient id={id} companyPhone={companyPhone} isAdmin={session.role === "admin"} />
  )
}
