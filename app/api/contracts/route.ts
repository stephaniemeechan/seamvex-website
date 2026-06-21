import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/get-session"
import { listContracts } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ contracts: await listContracts() })
}
