import { NextResponse } from "next/server"
import { requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { createAgreementSendTicket, updateTicket } from "@/lib/crm/tickets"
import { createDocumentFromPdf, documensoConfig } from "@/lib/documenso/client"
import { appBaseUrl, documensoRequired, legacySignAllowed } from "@/lib/env"
import { loadCustomerComms, fillCommsTemplate } from "@/lib/legal/comms"
import { sendEmail, logSentEmail } from "@/lib/gmail/client"
import {
  getOrder,
  markOrderSent,
  setDocumensoInfo,
} from "@/lib/proposals/orders"
import { generateContractPdf } from "@/lib/proposals/pdf"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const existing = await getOrder(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.status !== "contract") {
    return NextResponse.json({ error: "Generate contract before sending" }, { status: 400 })
  }
  if (!existing.contactId) {
    return NextResponse.json({ error: "Order has no contact" }, { status: 400 })
  }

  const recipientEmail = existing.customer.contactEmail ?? existing.customer.accountsEmail
  const recipientName =
    existing.customer.contactName ?? existing.customer.accountsContact ?? existing.customer.companyName
  if (!recipientEmail) {
    return NextResponse.json({ error: "Customer email is required to send" }, { status: 400 })
  }

  try {
    const pdfBuffer = await generateContractPdf(existing)
    let signUrl: string

    if (documensoRequired()) {
      if (!documensoConfig()) {
        return NextResponse.json({ error: "Documenso is required in production" }, { status: 503 })
      }
      const { documentId, signingUrl } = await createDocumentFromPdf(
        pdfBuffer,
        recipientEmail,
        recipientName,
        { title: `${existing.documentNumber} — Seamcor agreement`, externalId: existing.id },
      )
      if (!signingUrl) {
        return NextResponse.json({ error: "Documenso did not return a signing URL" }, { status: 500 })
      }
      signUrl = signingUrl
      await setDocumensoInfo(existing.id, documentId, signUrl)
    } else if (documensoConfig()) {
      const { documentId, signingUrl } = await createDocumentFromPdf(
        pdfBuffer,
        recipientEmail,
        recipientName,
        { title: `${existing.documentNumber} — Seamcor agreement`, externalId: existing.id },
      )
      if (!signingUrl) {
        return NextResponse.json({ error: "Documenso did not return a signing URL" }, { status: 500 })
      }
      signUrl = signingUrl
      await setDocumensoInfo(existing.id, documentId, signUrl)
    } else if (legacySignAllowed()) {
      signUrl = `${appBaseUrl()}/sign/${existing.signToken}`
    } else {
      return NextResponse.json({ error: "Documenso is required to send agreements" }, { status: 503 })
    }

    const order = await markOrderSent(id)
    if (!order) return NextResponse.json({ error: "Cannot send" }, { status: 400 })

    const { ticket } = await createAgreementSendTicket({
      contactId: existing.contactId,
      orderId: existing.id,
      createdBy: session.userId,
      assigneeUserId: session.userId,
    })

    let gmailSent = false
    let gmailError: string | undefined
    try {
      const comms = loadCustomerComms()
      const vars: Record<string, string> = {
        Name: recipientName.split(" ").pop() ?? existing.customer.companyName,
        "Name / team": recipientName,
        company: existing.customer.companyName,
        document: existing.documentNumber,
        documentNumber: existing.documentNumber,
        accountsEmail: existing.customer.accountsEmail ?? "",
        signingLink: signUrl,
      }
      const body =
        fillCommsTemplate(comms.coverNoteAgreement, vars) +
        "\n\nSign here: " +
        signUrl +
        "\n\nSeamvex Data Systems Ltd, trading as Seamcor"
      const subject = fillCommsTemplate(
        comms.emailSubjects[0] ?? "Seamcor — updated agreement",
        vars,
      )
      const sent = await sendEmail(session.userId, {
        to: recipientEmail,
        subject,
        body,
      })
      await logSentEmail({
        sentByUserId: session.userId,
        orderId: existing.id,
        ticketId: ticket.id,
        toEmail: recipientEmail,
        subject,
        gmailMessageId: sent.messageId,
        threadId: sent.threadId,
      })
      if (sent.threadId) {
        await updateTicket(ticket.id, { gmailThreadId: sent.threadId })
      }
      gmailSent = true
    } catch (e) {
      gmailError = e instanceof Error ? e.message : "Gmail send failed"
    }

    return NextResponse.json({
      order: sanitizeOrderForApi(order, session),
      signUrl,
      gmailSent,
      gmailError,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 },
    )
  }
}
