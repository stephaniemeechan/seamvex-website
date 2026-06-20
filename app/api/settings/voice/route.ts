import { NextResponse } from "next/server"
import { requireAdminMutation, requireAdminApi } from "@/lib/auth/api-guards"
import {
  getVoiceConfig,
  saveVoiceConfig,
  normalizeVoiceConfig,
  type VoiceConfig,
} from "@/lib/twilio/voice-config"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  const config = await getVoiceConfig()
  return NextResponse.json({ config })
}

export async function PUT(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as { config?: Partial<VoiceConfig> }
  if (!body.config || typeof body.config !== "object") {
    return NextResponse.json({ error: "config object required" }, { status: 400 })
  }

  const current = await getVoiceConfig()
  const merged = normalizeVoiceConfig({ ...current, ...body.config })
  const config = await saveVoiceConfig(merged)
  return NextResponse.json({ config })
}
