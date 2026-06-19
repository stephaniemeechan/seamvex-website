import React from "react"
import { Document, Page, Text, StyleSheet, Image } from "@react-pdf/renderer"
import { COMPANY } from "@/lib/brand"
import { loadPdfFooter } from "@/lib/legal/tc-body"
import { loadPrivacyMarkdown, splitPrivacySections } from "@/lib/legal/privacy"
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

type PrivacyProps = {
  customer: CustomerSnapshot
  documentNumber: string
  documentDate: string
}

export function PrivacyDocument({ customer, documentNumber, documentDate }: PrivacyProps) {
  const logoSrc = legalLogoPath()
  const logoData = fs.readFileSync(logoSrc)
  const logoUri = `data:image/png;base64,${logoData.toString("base64")}`
  const sections = splitPrivacySections(loadPrivacyMarkdown())
  const footer = loadPdfFooter()

  return (
    <Document title={`Platform Privacy Statement — ${customer.companyName}`}>
      <Page size="A4" style={styles.page}>
        <Image src={logoUri} style={styles.logo} />
        <Text style={styles.h1}>Platform Privacy Statement</Text>
        <Text style={styles.para}>
          {COMPANY.legalName}, trading as {COMPANY.tradingName} — document {documentNumber} — {documentDate}
        </Text>
        <Text style={styles.para}>Prepared for {customer.companyName}</Text>
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            {sec.heading && <Text style={styles.h2}>{sec.heading}</Text>}
            {sec.paragraphs.map((p, j) => (
              <Text key={j} style={styles.para}>{p}</Text>
            ))}
          </React.Fragment>
        ))}
        <Text style={styles.footer} fixed>{footer}</Text>
      </Page>
    </Document>
  )
}
