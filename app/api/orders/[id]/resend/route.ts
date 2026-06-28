import { NextResponse } from "next/server"
import { requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { listTickets, updateTicket } from "@/lib/crm/tickets"
import {
  createDocumentFromPdf,
  documensoConfig,
  getSigningUrl,
} from "@/lib/documenso/client"
import { appBaseUrl, documensoRequired, legacySignAllowed } from "@/lib/env"
import { loadCustomerComms, fillCommsTemplate, buildAgreementSendEmail } from "@/lib/legal/comms"
import { sendEmail, logSentEmail } from "@/lib/gmail/client"
import { getOrder, setDocumensoInfo } from "@/lib/proposals/orders"
import { generateContractPdf } from "@/lib/proposals/pdf"
import { resolvePersonFromSnapshot } from "@/lib/crm/contact-persons"

export const runtime = "nodejs"

async function resolveSignUrl(
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>,
  recipientEmail: string,
  recipientName: string,
): Promise<string> {
  let signUrl = order.documensoSigningUrl ?? ""

  if (order.documensoDocumentId && documensoConfig()) {
    const refreshed = await getSigningUrl(order.documensoDocumentId, recipientEmail)
    if (refreshed) {
      signUrl = refreshed
      if (signUrl !== order.documensoSigningUrl) {
        await setDocumensoInfo(order.id, order.documensoDocumentId, signUrl)
      }
    }
  }

  if (!signUrl && documensoRequired()) {
    if (!documensoConfig()) {
      throw new Error("Documenso is required in production")
    }
    const pdfBuffer = await generateContractPdf(order)
    const { documentId, signingUrl } = await createDocumentFromPdf(
      pdfBuffer,
      recipientEmail,
      recipientName,
      { title: `${order.documentNumber} — Seamcor agreement`, externalId: order.id },
    )
    if (!signingUrl) {
      throw new Error("Documenso did not return a signing URL")
    }
    signUrl = signingUrl
    await setDocumensoInfo(order.id, documentId, signUrl)
  } else if (!signUrl && documensoConfig()) {
    const pdfBuffer = await generateContractPdf(order)
    const { documentId, signingUrl } = await createDocumentFromPdf(
      pdfBuffer,
      recipientEmail,
      recipientName,
      { title: `${order.documentNumber} — Seamcor agreement`, externalId: order.id },
    )
    if (!signingUrl) {
      throw new Error("Documenso did not return a signing URL")
    }
    signUrl = signingUrl
    await setDocumensoInfo(order.id, documentId, signUrl)
  } else if (!signUrl && legacySignAllowed()) {
    signUrl = `${appBaseUrl()}/sign/${order.signToken}`
  } else if (!signUrl) {
    throw new Error("Documenso is required to resend agreements")
  }

  return signUrl
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const order = await getOrder(id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (order.status !== "sent") {
    return NextResponse.json({ error: "Only sent orders can be resent" }, { status: 400 })
  }
  if (!order.contactId) {
    return NextResponse.json({ error: "Order has no contact" }, { status: 400 })
  }

  const person = resolvePersonFromSnapshot(
    order.customer,
    order.customer.selectedPersonRef ?? "primary",
  )
  const recipientEmail = person.email ?? order.customer.accountsEmail
  const recipientName = person.name || order.customer.companyName
  if (!recipientEmail) {
    return NextResponse.json({ error: "Customer email is required to resend" }, { status: 400 })
  }

  try {
    const signUrl = await resolveSignUrl(order, recipientEmail, recipientName)

    let gmailSent = false
    let gmailError: string | undefined
    try {
      const comms = loadCustomerComms()
      const vars: Record<string, string> = {
        Name: recipientName.split(" ").pop() ?? order.customer.companyName,
        "Name / team": recipientName,
        company: order.customer.companyName,
        document: order.documentNumber,
        documentNumber: order.documentNumber,
        accountsEmail: order.customer.accountsEmail ?? "",
        signingLink: signUrl,
      }
      const body = buildAgreementSendEmail(
        fillCommsTemplate(comms.coverNoteAgreement, vars),
        signUrl,
      )
      const subject = fillCommsTemplate(
        comms.emailSubjects[0] ?? "Seamcor — updated agreement",
        vars,
      )
      const sent = await sendEmail(session.userId, {
        to: recipientEmail,
        subject,
        body,
      })

      const tickets = await listTickets({ contactId: order.contactId })
      const ticket = tickets.find((t) => t.orderId === order.id)

      await logSentEmail({
        sentByUserId: session.userId,
        orderId: order.id,
        ticketId: ticket?.id,
        toEmail: recipientEmail,
        subject,
        gmailMessageId: sent.messageId,
        threadId: sent.threadId,
      })
      if (ticket && sent.threadId) {
        await updateTicket(ticket.id, { gmailThreadId: sent.threadId })
      }
      gmailSent = true
    } catch (e) {
      gmailError = e instanceof Error ? e.message : "Gmail send failed"
    }

    const refreshed = await getOrder(id)
    return NextResponse.json({
      order: sanitizeOrderForApi(refreshed ?? order, session),
      signUrl,
      gmailSent,
      gmailError,
    })
  } catch (e) {
    if (e instanceof Error && e.message === "Documenso is required in production") {
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Resend failed" },
      { status: 500 },
    )
  }
}
