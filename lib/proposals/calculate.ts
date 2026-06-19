import { getCatalogueLabel, getDefaultUnitPrice } from "./catalogue"
import {
  bfLabelFromTerm,
  billingStart,
  contractEndFromStart,
  daysInclusive,
  parseIsoDate,
  roundMoney,
  toIsoDate,
} from "./billing"
import type { LicensingMode, OrderInput, OrderLineInput, OrderTotals, SkuId } from "./types"

const PER_USER_SKUS: SkuId[] = ["base_package", "concurrent_license", "named_license", "fully_managed", "hosting"]
const SITE_SKUS: SkuId[] = ["site_license", "hosting"]
const SITE_FM_SKUS: SkuId[] = ["site_license_fm", "hosting"]
const HOURLY_SKUS: SkuId[] = ["training_hour", "consultancy_hour"]

export function allowedSkusForMode(mode: LicensingMode): SkuId[] {
  switch (mode) {
    case "site_license":
      return [...SITE_SKUS, ...HOURLY_SKUS]
    case "site_license_fm":
      return [...SITE_FM_SKUS, ...HOURLY_SKUS]
    default:
      return [...PER_USER_SKUS, ...HOURLY_SKUS]
  }
}

export function deriveFullyManaged(lines: OrderLineInput[]): boolean {
  return lines.some(
    (l) => l.qty > 0 && (l.sku === "fully_managed" || l.sku === "site_license_fm"),
  )
}

export function validateLicensingMode(mode: LicensingMode, lines: OrderLineInput[]): string | null {
  const allowed = new Set(allowedSkusForMode(mode))
  for (const line of lines) {
    if (line.qty <= 0) continue
    if (!allowed.has(line.sku)) {
      return `${getCatalogueLabel(line.sku)} is not allowed in ${mode} licensing mode`
    }
  }
  if (mode === "per_user") {
    const hasBase = lines.some((l) => l.sku === "base_package" && l.qty > 0)
    const hasSite = lines.some((l) => (l.sku === "site_license" || l.sku === "site_license_fm") && l.qty > 0)
    if (!hasBase && !hasSite && lines.some((l) => l.qty > 0 && !HOURLY_SKUS.includes(l.sku))) {
      return "Per-user mode requires Base Package unless using hourly one-offs only"
    }
  }
  return null
}

function calcLineTotal(
  line: OrderLineInput,
  input: OrderInput,
  start: Date,
  end: Date,
): { lineTotal: number; termLabel: string; bfLabel: string } {
  const unit = line.unitPrice
  if (unit == null || unit <= 0 || line.qty <= 0) {
    return { lineTotal: 0, termLabel: "", bfLabel: "" }
  }

  const hourly = HOURLY_SKUS.includes(line.sku)
  if (hourly) {
    return { lineTotal: unit * line.qty, termLabel: "One-off", bfLabel: "One-off" }
  }

  if (line.isProRata && input.orderType === "amendment" && input.contractStart && input.contractEnd) {
    const origStart = parseIsoDate(input.contractStart)
    const origEnd = parseIsoDate(input.contractEnd)
    const daysRem = daysInclusive(start, origEnd)
    const daysFull = daysInclusive(origStart, origEnd)
    const lineTotal =
      unit * line.qty * input.termMonths * (daysRem / daysFull)
    return { lineTotal, termLabel: `Pro-rata (${daysRem} days)`, bfLabel: "Pro-rata" }
  }

  const months = input.termMonths
  return {
    lineTotal: unit * line.qty * months,
    termLabel: months === 1 ? "1 month" : `${months} months`,
    bfLabel: months === 1 ? "Monthly" : bfLabelFromTerm(months),
  }
}

export function calculateOrder(input: OrderInput): OrderTotals {
  const action = parseIsoDate(input.actionDate)
  const start = input.contractStart
    ? parseIsoDate(input.contractStart)
    : billingStart(action)
  const end = input.contractEnd
    ? parseIsoDate(input.contractEnd)
    : contractEndFromStart(start, input.termMonths)

  const lines = input.lines
    .filter((l) => l.qty > 0)
    .map((line) => {
      const listUnit = getDefaultUnitPrice(line.sku, input.currency, input.paymentMode)
      const unit = line.unitPrice ?? listUnit
      const includeInPdf = unit != null && unit > 0

      const effectiveStart = line.isProRata ? billingStart(action) : start
      const effectiveEnd = line.isProRata && input.contractEnd ? parseIsoDate(input.contractEnd) : end

      const { lineTotal, termLabel, bfLabel } = calcLineTotal(
        { ...line, unitPrice: unit },
        input,
        effectiveStart,
        effectiveEnd,
      )

      const afterPct = lineTotal * (1 - (line.lineDiscountPct ?? 0) / 100)
      const netLineTotal = roundMoney(afterPct - (line.lineDiscountFixed ?? 0))

      return {
        ...line,
        unitPrice: unit,
        listUnitPrice: listUnit,
        lineTotal: roundMoney(lineTotal),
        netLineTotal,
        termLabel,
        startDate: toIsoDate(effectiveStart),
        endDate: toIsoDate(effectiveEnd),
        bfLabel,
        includeInPdf,
      }
    })

  const subtotal = roundMoney(lines.filter((l) => l.includeInPdf).reduce((s, l) => s + l.netLineTotal, 0))
  const afterOrderPct = subtotal * (1 - (input.orderDiscountPct ?? 0) / 100)
  const orderTotal = roundMoney(afterOrderPct - (input.orderDiscountFixed ?? 0))

  return { subtotal, orderTotal, lines }
}

export function defaultLinesForMode(
  mode: LicensingMode,
  currency: Parameters<typeof getDefaultUnitPrice>[1],
  paymentMode: Parameters<typeof getDefaultUnitPrice>[2],
): OrderLineInput[] {
  const mk = (sku: SkuId, qty: number): OrderLineInput => ({
    sku,
    qty,
    unitPrice: getDefaultUnitPrice(sku, currency, paymentMode),
  })

  switch (mode) {
    case "site_license":
      return [mk("site_license", 1)]
    case "site_license_fm":
      return [mk("site_license_fm", 1)]
    default:
      return [mk("base_package", 1), mk("concurrent_license", 0), mk("named_license", 0)]
  }
}
