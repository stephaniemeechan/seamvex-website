import type { Currency, PaymentMode, SkuId } from "./types"

export type CatalogueEntry = {
  id: SkuId
  label: string
  recurring: boolean
  hourly: boolean
  hasDefaultPrice: boolean
}

/** Spreadsheet defaults — always editable in UI. ? SKUs have no default. */
const PRICES: Record<
  SkuId,
  Partial<Record<Currency, { paid_in_advance: number | null; paid_monthly: number | null }>>
> = {
  base_package: {
    GBP: { paid_in_advance: 169, paid_monthly: 186 },
    ZAR: { paid_in_advance: 2704, paid_monthly: 2974 },
    EUR: { paid_in_advance: 201, paid_monthly: 221 },
  },
  concurrent_license: {
    GBP: { paid_in_advance: 41, paid_monthly: 45 },
    ZAR: { paid_in_advance: 656, paid_monthly: 722 },
    EUR: { paid_in_advance: 49, paid_monthly: 54 },
  },
  named_license: {
    GBP: { paid_in_advance: 29, paid_monthly: 32 },
    ZAR: { paid_in_advance: 464, paid_monthly: 510 },
    EUR: { paid_in_advance: 35, paid_monthly: 38 },
  },
  site_license: {
    GBP: { paid_in_advance: null, paid_monthly: null },
    ZAR: { paid_in_advance: null, paid_monthly: null },
    EUR: { paid_in_advance: null, paid_monthly: null },
  },
  site_license_fm: {
    GBP: { paid_in_advance: null, paid_monthly: null },
    ZAR: { paid_in_advance: null, paid_monthly: null },
    EUR: { paid_in_advance: null, paid_monthly: null },
  },
  hosting: {
    GBP: { paid_in_advance: null, paid_monthly: null },
    ZAR: { paid_in_advance: null, paid_monthly: null },
    EUR: { paid_in_advance: null, paid_monthly: null },
  },
  fully_managed: {
    GBP: { paid_in_advance: 423, paid_monthly: 465 },
    ZAR: { paid_in_advance: 6768, paid_monthly: 7445 },
    EUR: { paid_in_advance: 503, paid_monthly: 554 },
  },
  training_hour: {
    GBP: { paid_in_advance: 1150, paid_monthly: 1150 },
    ZAR: { paid_in_advance: 18400, paid_monthly: 18400 },
    EUR: { paid_in_advance: 1369, paid_monthly: 1369 },
  },
  consultancy_hour: {
    GBP: { paid_in_advance: 1950, paid_monthly: 1950 },
    ZAR: { paid_in_advance: 31200, paid_monthly: 31200 },
    EUR: { paid_in_advance: 2321, paid_monthly: 2321 },
  },
}

export const CATALOGUE: CatalogueEntry[] = [
  { id: "base_package", label: "Base Package", recurring: true, hourly: false, hasDefaultPrice: true },
  { id: "concurrent_license", label: "Concurrent License", recurring: true, hourly: false, hasDefaultPrice: true },
  { id: "named_license", label: "Named License", recurring: true, hourly: false, hasDefaultPrice: true },
  {
    id: "site_license",
    label: "Site licence (unlimited users at one site)",
    recurring: true,
    hourly: false,
    hasDefaultPrice: false,
  },
  {
    id: "site_license_fm",
    label: "Site licence incl. Fully Managed (unlimited users + software setup)",
    recurring: true,
    hourly: false,
    hasDefaultPrice: false,
  },
  { id: "hosting", label: "Hosting (customer-side)", recurring: true, hourly: false, hasDefaultPrice: false },
  {
    id: "fully_managed",
    label: "Fully Managed Package (10 hrs/mo + PM & technical implementation)",
    recurring: true,
    hourly: false,
    hasDefaultPrice: true,
  },
  { id: "training_hour", label: "Training Per Hour", recurring: false, hourly: true, hasDefaultPrice: true },
  { id: "consultancy_hour", label: "Consultancy Per Hour", recurring: false, hourly: true, hasDefaultPrice: true },
]

export function getDefaultUnitPrice(
  sku: SkuId,
  currency: Currency,
  paymentMode: PaymentMode,
): number | null {
  const row = PRICES[sku]?.[currency]
  if (!row) return null
  return row[paymentMode]
}

export function getCatalogueLabel(sku: SkuId): string {
  return CATALOGUE.find((c) => c.id === sku)?.label ?? sku
}

export function currencySymbol(currency: Currency): string {
  if (currency === "GBP") return "£"
  if (currency === "EUR") return "€"
  return "R"
}

export function formatMoney(amount: number, currency: Currency): string {
  const sym = currencySymbol(currency)
  const formatted = amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (currency === "ZAR") return `${sym}${formatted}`
  return `${sym}${formatted}`
}
