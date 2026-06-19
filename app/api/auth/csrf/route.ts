import { NextResponse } from "next/server"
import { requireSessionApi } from "@/lib/auth/api-guards"
import { createCsrfToken } from "@/lib/auth/security"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session
  const token = await createCsrfToken()
  return NextResponse.json({ token })
}
