import React from "react"
import { Image, Text, View } from "@react-pdf/renderer"
import { pdfStyles } from "./pdf-theme"
import { getLegalLogoUri } from "./pdf-logo"
import type { CustomerSnapshot } from "./orders"

type PdfHeaderProps = {
  title: string
  documentNumber: string
  documentDate: string
  customerPo?: string | null
}

export function PdfHeader({ title, documentNumber, documentDate, customerPo }: PdfHeaderProps) {
  return (
    <>
      <Image src={getLegalLogoUri()} style={pdfStyles.logo} />
      <View style={pdfStyles.headerRule} />
      <Text style={pdfStyles.docTitle}>{title}</Text>
      <Text style={pdfStyles.docMeta}>
        {documentNumber} · {documentDate}
        {customerPo ? ` · PO ${customerPo}` : ""}
      </Text>
    </>
  )
}

export function PdfCustomerBlock({ customer }: { customer: CustomerSnapshot }) {
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
    <View>
      <Text style={pdfStyles.sectionTitle}>Customer</Text>
      <Text style={pdfStyles.customerName}>{customer.companyName}</Text>
      {customer.customerNumber && (
        <Text style={pdfStyles.customerLine}>Customer no. {customer.customerNumber}</Text>
      )}
      {address && <Text style={pdfStyles.customerLine}>{address}</Text>}
      {customer.contactName && (
        <Text style={pdfStyles.customerLine}>
          Contact: {customer.contactName}
          {customer.contactPhone ? ` · ${customer.contactPhone}` : ""}
        </Text>
      )}
      {customer.contactEmail && (
        <Text style={pdfStyles.customerLine}>{customer.contactEmail}</Text>
      )}
    </View>
  )
}

export function PdfFooter({ text }: { text: string }) {
  return (
    <Text
      style={pdfStyles.footer}
      fixed
      render={({ pageNumber, totalPages }) => `${text} · Page ${pageNumber} of ${totalPages}`}
    />
  )
}
