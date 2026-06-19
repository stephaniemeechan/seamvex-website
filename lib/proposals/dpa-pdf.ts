import React, { type ReactElement } from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { DpaDocument } from "@/lib/proposals/dpa-document"
import type { OrderRecord } from "@/lib/proposals/orders"

export async function generateDpaPdf(order: OrderRecord): Promise<Buffer> {
  const doc = React.createElement(DpaDocument, {
    customer: order.customer,
    documentNumber: order.documentNumber,
    documentDate: order.actionDate,
  })
  return renderToBuffer(doc as ReactElement<DocumentProps>)
}
