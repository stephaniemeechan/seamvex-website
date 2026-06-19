import React, { type ReactElement } from "react"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { SoftwareAgreementDocument } from "@/lib/proposals/pdf-document"
import { ProposalDocument } from "@/lib/proposals/proposal-document"
import type { OrderRecord } from "@/lib/proposals/orders"
import { saveOrderPdf as persistOrderPdf } from "@/lib/storage/pdfs"

export async function generateProposalPdf(order: OrderRecord): Promise<Buffer> {
  const doc = React.createElement(ProposalDocument, { order })
  return renderToBuffer(doc as ReactElement<DocumentProps>)
}

export async function generateContractPdf(
  order: OrderRecord,
  signature?: { name: string; position: string; date: string; poNumber?: string },
): Promise<Buffer> {
  const doc = React.createElement(SoftwareAgreementDocument, { order, signature })
  return renderToBuffer(doc as ReactElement<DocumentProps>)
}

/** @deprecated Use generateContractPdf */
export async function generateOrderPdf(
  order: OrderRecord,
  signature?: { name: string; position: string; date: string; poNumber?: string },
): Promise<Buffer> {
  return generateContractPdf(order, signature)
}

export async function saveOrderPdf(
  order: OrderRecord,
  signature?: { name: string; position: string; date: string; poNumber?: string },
): Promise<string> {
  const buffer = await generateContractPdf(order, signature)
  return persistOrderPdf(order.id, `${order.documentNumber}.pdf`, buffer)
}
