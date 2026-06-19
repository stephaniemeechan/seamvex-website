import { NextResponse } from "next/server"
import { requireAdminMutation, requireSessionApi } from "@/lib/auth/api-guards"
import { getSetting, setSetting } from "@/lib/db"

export const runtime = "nodejs"

export type ResourceLink = { label: string; url: string }

function parseResources(raw: string | null): ResourceLink[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ResourceLink =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ResourceLink).label === "string" &&
        typeof (item as ResourceLink).url === "string",
    )
  } catch {
    return []
  }
}

export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const resources = parseResources(await getSetting("resources"))
  return NextResponse.json({ resources })
}

export async function PUT(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as { resources?: ResourceLink[] }
  if (!Array.isArray(body.resources)) {
    return NextResponse.json({ error: "resources array required" }, { status: 400 })
  }

  const resources = body.resources
    .filter((r) => r.label?.trim() && r.url?.trim())
    .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))

  await setSetting("resources", JSON.stringify(resources))
  return NextResponse.json({ resources })
}
