export type Currency = "GBP" | "ZAR" | "EUR"
export type PaymentMode = "paid_in_advance" | "paid_monthly"
export type LicensingMode = "per_user" | "site_license" | "site_license_fm"
export type Deployment = "on_premises" | "private_cloud"
export type OrderType = "new" | "amendment" | "renewal"
export type OrderStatus = "proposal" | "contract" | "sent" | "signed" | "void"
export type RolloutStatus = "not_started" | "comms_sent" | "proposal_sent" | "signed" | "blocked"
export type CollectionMethod = "invoice" | "direct_debit" | "stripe"

export type SkuId =
  | "base_package"
  | "concurrent_license"
  | "named_license"
  | "site_license"
  | "site_license_fm"
  | "hosting"
  | "fully_managed"
  | "training_hour"
  | "consultancy_hour"

export type OrderLineInput = {
  sku: SkuId
  qty: number
  unitPrice: number | null
  lineDiscountPct?: number
  lineDiscountFixed?: number
  isProRata?: boolean
  description?: string
}

export type OrderLineCalculated = OrderLineInput & {
  listUnitPrice: number | null
  lineTotal: number
  netLineTotal: number
  termLabel: string
  startDate: string
  endDate: string
  bfLabel: string
  includeInPdf: boolean
}

export type OrderInput = {
  orderType: OrderType
  currency: Currency
  paymentMode: PaymentMode
  termMonths: 1 | 3 | 4 | 6 | 12
  licensingMode: LicensingMode
  deployment: Deployment
  fullyManaged: boolean
  supportType: "standard" | "premium"
  contractType: "software_rental" | "capex"
  collectionMethod: CollectionMethod
  actionDate: string
  contractStart?: string
  contractEnd?: string
  amendmentDate?: string | null
  customerPo?: string | null
  /** @deprecated Legacy DB field — no longer set from UI */
  legacyAgreementDate?: string | null
  /** @deprecated Legacy DB field — no longer set from UI */
  legacyDocumentNumber?: string | null
  notes?: string
  orderDiscountPct?: number
  orderDiscountFixed?: number
  lines: OrderLineInput[]
}

export type OrderTotals = {
  subtotal: number
  orderTotal: number
  lines: OrderLineCalculated[]
}
