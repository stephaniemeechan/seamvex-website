import { ContactsListClient } from "@/components/contacts-list-client"
import { getSession } from "@/lib/auth/get-session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ContactsPage() {
  const session = await getSession()
  if (!session) redirect("/admin/login")

  return <ContactsListClient isAdmin={session.role === "admin"} />
}
