import React from "react"
import { Document, Page } from "@react-pdf/renderer"
import { loadPdfFooter } from "@/lib/legal/tc-body"
import type { OrderRecord } from "@/lib/proposals/orders"
import type { OrderInput } from "@/lib/proposals/types"
import { PdfCustomerBlock, PdfFooter, PdfHeader } from "@/lib/proposals/pdf-blocks"
import { PricingTables } from "@/lib/proposals/pricing-tables"
import { pdfStyles } from "@/lib/proposals/pdf-theme"

type ProposalDocumentProps = {
  order: OrderRecord
}

export function ProposalDocument({ order }: ProposalDocumentProps) {
  const payload = order.lines as {
    input: OrderInput
    calculated: { lines: import("@/lib/proposals/types").OrderLineCalculated[]; orderTotal: number; subtotal: number }
  }
  const currency = order.currency as "GBP" | "ZAR" | "EUR"
  const footer = loadPdfFooter()

  return (
    <Document title={`Proposal ${order.documentNumber}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          title="Seamcor Proposal"
          documentNumber={order.documentNumber}
          documentDate={order.actionDate}
          customerPo={order.customerPo ?? payload.input.customerPo}
        />
        <PdfCustomerBlock customer={order.customer} />
        <PricingTables input={payload.input} calculated={payload.calculated} currency={currency} />
        <PdfFooter text={footer} />
      </Page>
    </Document>
  )
}
