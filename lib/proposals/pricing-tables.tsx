import React from "react"
import { Text, View } from "@react-pdf/renderer"
import { formatMoney } from "./catalogue"
import { pdfStyles } from "./pdf-theme"
import {
  buildPricingSummary,
  commercialTermsBullets,
  lineItemLabel,
  lineItemSubtext,
  type PricingSummary,
} from "./pricing-summary"
import type { Currency, OrderInput, OrderLineCalculated } from "./types"

type PricingTablesProps = {
  input: OrderInput
  calculated: { lines: OrderLineCalculated[]; orderTotal: number; subtotal: number }
  currency: Currency
  summary?: PricingSummary
  showCommercialTerms?: boolean
}

export function PricingTables({
  input,
  calculated,
  currency,
  summary: summaryProp,
  showCommercialTerms = true,
}: PricingTablesProps) {
  const summary = summaryProp ?? buildPricingSummary(input, calculated)

  return (
    <>
      {summary.sections.map((section) => (
        <View key={section.id} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>{section.title}</Text>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.colItem}>Item</Text>
            <Text style={pdfStyles.colPrice}>{section.priceColumnLabel}</Text>
            <Text style={pdfStyles.colQty}>Qty</Text>
            <Text style={pdfStyles.colTotal}>Total</Text>
          </View>
          {section.lines.map((line, i) => (
            <View key={line.sku} style={i % 2 === 1 ? pdfStyles.tableRowAlt : pdfStyles.tableRow}>
              <View style={pdfStyles.colItem}>
                <Text>{lineItemLabel(line)}</Text>
                {lineItemSubtext(line) && (
                  <Text style={pdfStyles.itemSub}>{lineItemSubtext(line)}</Text>
                )}
              </View>
              <Text style={pdfStyles.colPrice}>
                {line.unitPrice != null ? formatMoney(line.unitPrice, currency) : "—"}
              </Text>
              <Text style={pdfStyles.colQty}>{line.qty}</Text>
              <Text style={pdfStyles.colTotal}>{formatMoney(line.netLineTotal, currency)}</Text>
            </View>
          ))}
          <View style={pdfStyles.tableFooter}>
            <Text style={pdfStyles.colItem}>Section total</Text>
            <Text style={pdfStyles.colPrice} />
            <Text style={pdfStyles.colQty} />
            <Text style={pdfStyles.colTotal}>{formatMoney(section.sectionTotal, currency)}</Text>
          </View>
        </View>
      ))}

      <View style={pdfStyles.summaryBox}>
        {summary.recurringTotal > 0 && (
          <>
            <View style={pdfStyles.summaryRow}>
              <Text>Total monthly (recurring)</Text>
              <Text>{formatMoney(summary.monthlyEquivalent, currency)}</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text>Total annual payment</Text>
              <Text>{formatMoney(summary.annualPayment, currency)}</Text>
            </View>
          </>
        )}
        {summary.oneOffTotal > 0 && (
          <View style={pdfStyles.summaryRow}>
            <Text>Total one-off</Text>
            <Text>{formatMoney(summary.oneOffTotal, currency)}</Text>
          </View>
        )}
        <View style={pdfStyles.summaryGrand}>
          <Text>Grand total ({input.termMonths} mo term)</Text>
          <Text>{formatMoney(summary.grandTotal, currency)}</Text>
        </View>
        <Text style={{ fontSize: 7, color: "#64748B", marginTop: 4, textAlign: "right" }}>
          All prices exclude VAT
        </Text>
      </View>

      {showCommercialTerms && (
        <View style={pdfStyles.termsStrip}>
          <Text style={{ ...pdfStyles.sectionTitle, marginTop: 0, marginBottom: 4 }}>
            Commercial terms
          </Text>
          {commercialTermsBullets(input, currency).map((b) => (
            <Text key={b} style={pdfStyles.termsBullet}>
              • {b}
            </Text>
          ))}
        </View>
      )}
    </>
  )
}
