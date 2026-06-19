import React, { type ReactElement } from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { PrivacyDocument } from "@/lib/proposals/privacy-document"
import type { OrderRecord } from "@/lib/proposals/orders"

export async function generatePrivacyPdf(order: OrderRecord): Promise<Buffer> {
  const doc = React.createElement(PrivacyDocument, {
    customer: order.customer,
    documentNumber: order.documentNumber,
    documentDate: order.actionDate,
  })
  return renderToBuffer(doc as ReactElement<DocumentProps>)
}
