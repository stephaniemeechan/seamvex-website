import { getSession } from "@/lib/auth/get-session"
import { TasksClient } from "@/components/tasks-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  return <TasksClient isAdmin={session.role === "admin"} />
}
