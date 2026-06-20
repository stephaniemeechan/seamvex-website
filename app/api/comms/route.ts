import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/rbac"
import { loadCustomerComms, fillCommsTemplate, buildAgreementSendEmail } from "@/lib/legal/comms"
import { getOrder } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const comms = loadCustomerComms()
    const orderId = new URL(request.url).searchParams.get("orderId")
    if (!orderId) return NextResponse.json(comms)

    const order = await getOrder(orderId)
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const signingLink = new URL(request.url).searchParams.get("signingLink") ?? ""
    const vars: Record<string, string> = {
      Name: order.customer.contactName?.split(" ").pop() ?? order.customer.companyName,
      "Name / team": order.customer.contactName ?? order.customer.companyName,
      company: order.customer.companyName,
      document: order.documentNumber,
      documentNumber: order.documentNumber,
      accountsEmail: order.customer.accountsEmail ?? "",
      signingLink,
    }

    const coverFilled = fillCommsTemplate(comms.coverNoteAgreement, vars)
    const subject = fillCommsTemplate(
      comms.emailSubjects[0] ?? "Seamcor — updated agreement",
      vars,
    )

    return NextResponse.json({
      ...comms,
      coverNoteAgreement: coverFilled,
      emailBody: fillCommsTemplate(comms.emailBody, vars),
      followUpBody: fillCommsTemplate(comms.followUpBody, vars),
      emailSubject: subject,
      sendPreviewBody: signingLink
        ? buildAgreementSendEmail(coverFilled, signingLink)
        : buildAgreementSendEmail(coverFilled, "[signing link on send]"),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Comms not available" },
      { status: 500 },
    )
  }
}
