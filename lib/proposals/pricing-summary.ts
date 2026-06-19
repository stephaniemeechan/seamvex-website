import { getCatalogueLabel } from "./catalogue"
import type { CollectionMethod, Currency, OrderInput, OrderLineCalculated, PaymentMode, SkuId } from "./types"
import { roundMoney } from "./billing"

const SOFTWARE_SKUS: SkuId[] = [
  "base_package",
  "concurrent_license",
  "named_license",
  "site_license",
  "site_license_fm",
  "hosting",
]
const FM_SKUS: SkuId[] = ["fully_managed"]
const ONEOFF_SKUS: SkuId[] = ["training_hour", "consultancy_hour"]

export type PricingSection = {
  id: "software" | "fully_managed" | "one_off"
  title: string
  priceColumnLabel: string
  lines: OrderLineCalculated[]
  sectionTotal: number
}

export type PricingSummary = {
  sections: PricingSection[]
  recurringTotal: number
  oneOffTotal: number
  monthlyEquivalent: number
  annualPayment: number
  grandTotal: number
  subtotal: number
}

export function paymentModeLabel(paymentMode: PaymentMode): string {
  return paymentMode === "paid_monthly" ? "Paid monthly" : "Paid for the full term"
}

export function collectionMethodLabel(method: CollectionMethod): string {
  switch (method) {
    case "stripe":
      return "Stripe"
    case "direct_debit":
      return "Direct Debit"
    default:
      return "Invoice"
  }
}

function unitPriceLabel(paymentMode: PaymentMode, termMonths: number): string {
  if (paymentMode === "paid_monthly") return "Cost per month / paid monthly"
  if (termMonths === 12) return "Cost per month / paid for full term (annual)"
  return `Cost per month / paid for full term (${termMonths} mo)`
}

function oneOffPriceLabel(): string {
  return "Per hour"
}

export function buildPricingSummary(
  input: OrderInput,
  calculated: { lines: OrderLineCalculated[]; orderTotal: number; subtotal: number },
): PricingSummary {
  const active = calculated.lines.filter((l) => l.includeInPdf && l.qty > 0)

  const softwareLines = active.filter((l) => SOFTWARE_SKUS.includes(l.sku))
  const fmLines = active.filter((l) => FM_SKUS.includes(l.sku))
  const oneOffLines = active.filter((l) => ONEOFF_SKUS.includes(l.sku))

  const sum = (lines: OrderLineCalculated[]) =>
    roundMoney(lines.reduce((s, l) => s + l.netLineTotal, 0))

  const sections: PricingSection[] = []

  if (softwareLines.length > 0) {
    sections.push({
      id: "software",
      title: "Seamcor Software Licences",
      priceColumnLabel: unitPriceLabel(input.paymentMode, input.termMonths),
      lines: softwareLines,
      sectionTotal: sum(softwareLines),
    })
  }

  if (fmLines.length > 0) {
    sections.push({
      id: "fully_managed",
      title: "Fully Managed Packages",
      priceColumnLabel: unitPriceLabel(input.paymentMode, input.termMonths),
      lines: fmLines,
      sectionTotal: sum(fmLines),
    })
  }

  if (oneOffLines.length > 0) {
    sections.push({
      id: "one_off",
      title: "One-off Items",
      priceColumnLabel: oneOffPriceLabel(),
      lines: oneOffLines,
      sectionTotal: sum(oneOffLines),
    })
  }

  const recurringTotal = roundMoney(sum(softwareLines) + sum(fmLines))
  const oneOffTotal = sum(oneOffLines)
  const termMonths = input.termMonths || 1
  const monthlyEquivalent =
    termMonths > 0 ? roundMoney(recurringTotal / termMonths) : recurringTotal
  const annualPayment =
    input.paymentMode === "paid_in_advance" && termMonths === 12
      ? recurringTotal
      : roundMoney(monthlyEquivalent * 12)

  return {
    sections,
    recurringTotal,
    oneOffTotal,
    monthlyEquivalent,
    annualPayment,
    grandTotal: calculated.orderTotal,
    subtotal: calculated.subtotal,
  }
}

export function lineItemLabel(line: OrderLineCalculated): string {
  return line.description ?? getCatalogueLabel(line.sku)
}

export function lineItemSubtext(line: OrderLineCalculated): string | null {
  switch (line.sku) {
    case "site_license":
      return "Unlimited named or concurrent users at one customer site. Customer hosts and manages the platform."
    case "site_license_fm":
      return "Unlimited users at one site, including Fully Managed — Seamvex installs and configures the software front-end."
    case "fully_managed":
      return "Software front-end setup and ongoing managed service (10 hrs/mo + PM)."
    default:
      return null
  }
}

export function commercialTermsBullets(input: OrderInput, currency: Currency): string[] {
  const term = input.termMonths === 1 ? "1 month" : `${input.termMonths} months`
  return [
    `Term: ${term}`,
    "Notice period: 3 months",
    paymentModeLabel(input.paymentMode),
    `Collection: ${collectionMethodLabel(input.collectionMethod)}`,
    `Currency: ${currency}`,
    "All prices exclude VAT",
  ]
}
