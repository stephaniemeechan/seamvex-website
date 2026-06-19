import React from "react"
import { Document, Page, Text, StyleSheet, Image } from "@react-pdf/renderer"
import { COMPANY } from "@/lib/brand"
import { loadPdfFooter } from "@/lib/legal/tc-body"
import { dpaPartiesBlock, splitDpaSections, loadDpaMarkdown } from "@/lib/legal/dpa"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import { PDF_COLORS } from "@/lib/proposals/pdf-theme"
import fs from "fs"
import { legalLogoPath } from "@/lib/legal/paths"

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: PDF_COLORS.muted },
  h1: { fontSize: 16, fontWeight: "bold", color: PDF_COLORS.primary, marginBottom: 8 },
  h2: { fontSize: 11, fontWeight: "bold", color: PDF_COLORS.primary, marginTop: 10, marginBottom: 4 },
  para: { fontSize: 8, marginBottom: 4, textAlign: "justify" },
  logo: { width: 360, marginBottom: 12 },
})

type DpaProps = {
  customer: CustomerSnapshot
  documentNumber: string
  documentDate: string
}

export function DpaDocument({ customer, documentNumber, documentDate }: DpaProps) {
  const logoSrc = legalLogoPath()
  const logoData = fs.readFileSync(logoSrc)
  const logoUri = `data:image/png;base64,${logoData.toString("base64")}`
  const sections = splitDpaSections(loadDpaMarkdown())
  const footer = loadPdfFooter()
  const address = [
    customer.billingAddress1,
    customer.billingAddress2,
    customer.billingAddress3,
    customer.postcode,
    customer.country,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Document title={`Data Processing Agreement — ${customer.companyName}`}>
      <Page size="A4" style={styles.page}>
        <Image src={logoUri} style={styles.logo} />
        <Text style={styles.h1}>Data Processing Agreement</Text>
        <Text style={styles.para}>
          {COMPANY.legalName}, trading as {COMPANY.tradingName} — document {documentNumber} — {documentDate}
        </Text>
        <Text style={styles.h2}>Parties</Text>
        <Text style={styles.para}>{dpaPartiesBlock(customer.companyName, address || "—")}</Text>
        {sections.slice(0, 4).map((sec, i) => (
          <React.Fragment key={i}>
            {sec.heading && <Text style={styles.h2}>{sec.heading}</Text>}
            {sec.paragraphs.map((p, j) => (
              <Text key={j} style={styles.para}>{p}</Text>
            ))}
          </React.Fragment>
        ))}
        <Text style={styles.footer} fixed>{footer}</Text>
      </Page>
      {sections.slice(4).map((sec, i) => (
        <Page key={i} size="A4" style={styles.page}>
          {sec.heading && <Text style={styles.h2}>{sec.heading}</Text>}
          {sec.paragraphs.map((p, j) => (
            <Text key={j} style={styles.para}>{p}</Text>
          ))}
          <Text style={styles.footer} fixed>{footer}</Text>
        </Page>
      ))}
    </Document>
  )
}
