import { getSetting, setSetting } from "@/lib/db"
import { listUsers } from "@/lib/crm/users"
import { isValidE164, normalizePhoneE164 } from "@/lib/phone/normalize"

export type VoiceRingMode = "crm_users" | "explicit_list"
export type VoiceNoAnswerAction = "forward_mobile" | "hangup"

export type VoiceConfig = {
  timezone: string
  hoursStart: string
  hoursEnd: string
  daysOfWeek: number[]
  forceClosed: boolean
  inHoursGreeting: string
  afterHoursGreeting: string
  afterHoursPhone: string
  ringMode: VoiceRingMode
  explicitRingPhones: string[]
  noAnswerAction: VoiceNoAnswerAction
  noAnswerTimeoutSec: number
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  timezone: "Europe/London",
  hoursStart: "08:00",
  hoursEnd: "20:00",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  forceClosed: false,
  inHoursGreeting: "",
  afterHoursGreeting: "Thank you for calling Seamcor. Our support line is currently closed.",
  afterHoursPhone: "",
  ringMode: "crm_users",
  explicitRingPhones: [],
  noAnswerAction: "forward_mobile",
  noAnswerTimeoutSec: 30,
}

const VOICE_CONFIG_KEY = "voice_config"
const MAX_RING_PHONES = 10

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

export function parseVoiceConfig(raw: string | null): VoiceConfig {
  if (!raw) return { ...DEFAULT_VOICE_CONFIG }
  try {
    const parsed = JSON.parse(raw) as Partial<VoiceConfig>
    return {
      ...DEFAULT_VOICE_CONFIG,
      ...parsed,
      daysOfWeek: Array.isArray(parsed.daysOfWeek)
        ? parsed.daysOfWeek.filter((d) => typeof d === "number")
        : DEFAULT_VOICE_CONFIG.daysOfWeek,
      explicitRingPhones: Array.isArray(parsed.explicitRingPhones)
        ? parsed.explicitRingPhones.filter((p) => typeof p === "string")
        : [],
    }
  } catch {
    return { ...DEFAULT_VOICE_CONFIG }
  }
}

export async function getVoiceConfig(): Promise<VoiceConfig> {
  return parseVoiceConfig(await getSetting(VOICE_CONFIG_KEY))
}

export async function saveVoiceConfig(config: VoiceConfig): Promise<VoiceConfig> {
  const normalized = normalizeVoiceConfig(config)
  await setSetting(VOICE_CONFIG_KEY, JSON.stringify(normalized))
  return normalized
}

export function normalizeVoiceConfig(input: VoiceConfig): VoiceConfig {
  const afterHoursPhone = input.afterHoursPhone.trim()
    ? normalizePhoneE164(input.afterHoursPhone) ?? ""
    : ""
  const explicitRingPhones = input.explicitRingPhones
    .map((p) => normalizePhoneE164(p.trim()))
    .filter((p): p is string => Boolean(p && isValidE164(p)))
    .slice(0, MAX_RING_PHONES)

  return {
    timezone: input.timezone.trim() || DEFAULT_VOICE_CONFIG.timezone,
    hoursStart: input.hoursStart.trim() || DEFAULT_VOICE_CONFIG.hoursStart,
    hoursEnd: input.hoursEnd.trim() || DEFAULT_VOICE_CONFIG.hoursEnd,
    daysOfWeek: input.daysOfWeek.length ? input.daysOfWeek : DEFAULT_VOICE_CONFIG.daysOfWeek,
    forceClosed: Boolean(input.forceClosed),
    inHoursGreeting: input.inHoursGreeting.trim(),
    afterHoursGreeting: input.afterHoursGreeting.trim() || DEFAULT_VOICE_CONFIG.afterHoursGreeting,
    afterHoursPhone,
    ringMode: input.ringMode === "explicit_list" ? "explicit_list" : "crm_users",
    explicitRingPhones,
    noAnswerAction: input.noAnswerAction === "hangup" ? "hangup" : "forward_mobile",
    noAnswerTimeoutSec: Math.min(60, Math.max(10, input.noAnswerTimeoutSec || 30)),
  }
}

export function isWithinBusinessHours(config: VoiceConfig, now = new Date()): boolean {
  if (config.forceClosed) return false

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00"
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00"

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const day = dayMap[weekday.slice(0, 3)] ?? 0
  if (!config.daysOfWeek.includes(day)) return false

  const current = parseTimeToMinutes(`${hour}:${minute}`)
  const start = parseTimeToMinutes(config.hoursStart)
  const end = parseTimeToMinutes(config.hoursEnd)
  return current >= start && current < end
}

export async function resolveRingPhones(config: VoiceConfig): Promise<string[]> {
  if (config.ringMode === "explicit_list") {
    return config.explicitRingPhones.slice(0, MAX_RING_PHONES)
  }

  const users = await listUsers()
  return users
    .filter((u) => u.active && u.availableForCalls && u.phone && isValidE164(u.phone))
    .map((u) => u.phone!)
    .slice(0, MAX_RING_PHONES)
}

export { MAX_RING_PHONES, VOICE_CONFIG_KEY }
