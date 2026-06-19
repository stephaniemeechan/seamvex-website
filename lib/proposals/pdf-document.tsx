import React from "react"
import { Document, Page, Text } from "@react-pdf/renderer"
import { COMPANY } from "@/lib/brand"
import {
  flowTcBlocks,
  formatLegalAcknowledgement,
  loadPdfFooter,
  loadSupportProcedures,
  loadAgreementSignatory,
} from "@/lib/legal/tc-body"
import type { OrderRecord } from "@/lib/proposals/orders"
import type { OrderInput } from "@/lib/proposals/types"
import { collectionMethodLabel, paymentModeLabel } from "@/lib/proposals/pricing-summary"
import { PdfCustomerBlock, PdfFooter, PdfHeader } from "@/lib/proposals/pdf-blocks"
import { PricingTables } from "@/lib/proposals/pricing-tables"
import { pdfStyles } from "@/lib/proposals/pdf-theme"

function supportTypeLabel(supportType: string): string {
  return supportType === "standard" ? "Standard" : "Premium"
}

function filterSupportHours(hours: string[], supportType: string, fullyManaged: boolean): string[] {
  const tier = supportType === "standard" ? "Standard" : "Premium"
  return hours.filter((h) => {
    if (h.startsWith(tier)) return true
    if (fullyManaged && h.startsWith("Fully Managed")) return true
    if (h.startsWith("SOTI")) return true
    return false
  })
}

type ContractDocumentProps = {
  order: OrderRecord
  signature?: { name: string; position: string; date: string; poNumber?: string }
}

export function SoftwareAgreementDocument({ order, signature }: ContractDocumentProps) {
  const payload = order.lines as {
    input: OrderInput
    calculated: { lines: import("@/lib/proposals/types").OrderLineCalculated[]; orderTotal: number; subtotal: number }
  }
  const support = loadSupportProcedures()
  const footer = loadPdfFooter()
  const acknowledgement = formatLegalAcknowledgement({
    priorAgreementDate: order.legacyAgreementDate,
    priorDocumentNumber: order.legacyDocumentNumber,
  })
  const signatory = loadAgreementSignatory()
  const tcBlocks = flowTcBlocks()
  const c = order.customer
  const currency = order.currency as "GBP" | "ZAR" | "EUR"
  const input = payload.input
  const poNumber = signature?.poNumber || order.customerPo || input.customerPo

  return (
    <Document title={`Software Agreement ${order.documentNumber}`}>
      <Page size="A4" style={pdfStyles.page} wrap>
        <PdfHeader
          title="Software Agreement"
          documentNumber={order.documentNumber}
          documentDate={order.actionDate}
          customerPo={poNumber}
        />
        <PdfCustomerBlock customer={c} />

        <Text style={pdfStyles.sectionTitle}>Contract details</Text>
        <Text style={pdfStyles.detailRow}>
          <Text style={pdfStyles.label}>Contract period </Text>
          {order.contractStart ?? "—"} to {order.contractEnd ?? "—"}
        </Text>
        <Text style={pdfStyles.detailRow}>
          <Text style={pdfStyles.label}>Term </Text>
          {order.termMonths} months · {paymentModeLabel(input.paymentMode)}
        </Text>
        <Text style={pdfStyles.detailRow}>
          <Text style={pdfStyles.label}>Support </Text>
          {supportTypeLabel(input.supportType)}
        </Text>
        <Text style={pdfStyles.detailRow}>
          <Text style={pdfStyles.label}>Collection </Text>
          {collectionMethodLabel(input.collectionMethod)}
        </Text>
        {poNumber && (
          <Text style={pdfStyles.detailRow}>
            <Text style={pdfStyles.label}>Customer PO </Text>
            {poNumber}
          </Text>
        )}
        <Text style={pdfStyles.detailRow}>
          <Text style={pdfStyles.label}>Pricing </Text>
          All prices exclude VAT
        </Text>

        <PricingTables
          input={input}
          calculated={payload.calculated}
          currency={currency}
          showCommercialTerms={false}
        />

        <Text style={pdfStyles.sectionTitle}>Support procedures</Text>
        <Text style={pdfStyles.detailRow}>{support.intro}</Text>
        {filterSupportHours(support.hours, input.supportType, input.fullyManaged).map((h) => (
          <Text key={h} style={pdfStyles.detailRow}>{h}</Text>
        ))}
        <Text style={pdfStyles.detailRow}>{support.upgrade}</Text>

        <Text style={pdfStyles.sectionTitle}>Signatures</Text>
        <Text style={{ marginTop: 6, fontSize: 9 }}>Signed for and on behalf of the Customer:</Text>
        <Text style={pdfStyles.detailRow}>Signature: {signature ? "Signed electronically" : "___________________________"}</Text>
        <Text style={pdfStyles.detailRow}>Full Name: {signature?.name ?? "___________________________"}</Text>
        <Text style={pdfStyles.detailRow}>Position: {signature?.position ?? "___________________________"}</Text>
        <Text style={pdfStyles.detailRow}>Date: {signature?.date ?? "___________________________"}</Text>
        <Text style={pdfStyles.detailRow}>PO number: {poNumber ?? "___________________________"}</Text>

        <Text style={{ marginTop: 10, fontSize: 9 }}>
          Signed for and on behalf of {COMPANY.legalName}, trading as {COMPANY.tradingName}:
        </Text>
        <Text style={pdfStyles.detailRow}>Signature: ___________________________</Text>
        <Text style={pdfStyles.detailRow}>Full Name: {signatory.name}</Text>
        <Text style={pdfStyles.detailRow}>Position: {signatory.position}</Text>
        <Text style={pdfStyles.detailRow}>Date: {signature?.date ?? "___________________________"}</Text>

        <Text style={{ marginTop: 10, fontSize: 7.5, lineHeight: 1.35 }}>{acknowledgement}</Text>

        <PdfFooter text={footer} />
      </Page>

      <Page size="A4" style={pdfStyles.page} wrap>
        <Text style={pdfStyles.tcTitle}>SEAMCOR TERMS AND CONDITIONS</Text>
        <Text style={{ ...pdfStyles.detailRow, marginBottom: 8 }}>
          {COMPANY.legalName}, trading as {COMPANY.tradingName} — company number {COMPANY.number}
        </Text>
        {tcBlocks.map((block, i) =>
          block.type === "heading" ? (
            <Text key={i} style={pdfStyles.tcHeading}>{block.text}</Text>
          ) : (
            <Text key={i} style={pdfStyles.tcPara}>{block.text}</Text>
          ),
        )}
        <PdfFooter text={footer} />
      </Page>
    </Document>
  )
}
