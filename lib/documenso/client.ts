import { timingSafeEqual } from "crypto"

const DEFAULT_API_URL = "https://app.documenso.com/api/v2"

export function documensoConfig(): { apiUrl: string; apiKey: string } | null {
  const apiUrl = (process.env.DOCUMENSO_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "")
  const apiKey = process.env.DOCUMENSO_API_KEY
  if (!apiKey) return null
  return { apiUrl, apiKey }
}

function authHeaders(apiKey: string): HeadersInit {
  return { Authorization: apiKey }
}

type EnvelopeRecipient = {
  id?: number
  email: string
  name: string
  role: string
  signingUrl?: string
}

type EnvelopeResponse = {
  id: string
  status: string
  recipients?: EnvelopeRecipient[]
  envelopeItems?: { id: string }[]
}

export async function createDocumentFromPdf(
  pdfBuffer: Buffer,
  recipientEmail: string,
  recipientName: string,
  opts?: { title?: string; externalId?: string },
): Promise<{ documentId: string; signingUrl: string | null }> {
  const cfg = documensoConfig()
  if (!cfg) throw new Error("Documenso not configured")

  const form = new FormData()
  const payload = {
    type: "DOCUMENT",
    title: opts?.title ?? "Seamcor agreement",
    externalId: opts?.externalId,
    recipients: [
      {
        email: recipientEmail,
        name: recipientName,
        role: "SIGNER",
        fields: [
          {
            identifier: 0,
            type: "SIGNATURE",
            page: 1,
            positionX: 10,
            positionY: 82,
            width: 35,
            height: 5,
          },
          {
            identifier: 0,
            type: "DATE",
            page: 1,
            positionX: 55,
            positionY: 82,
            width: 20,
            height: 3,
          },
        ],
      },
    ],
  }
  form.append("payload", JSON.stringify(payload))
  form.append("files", new Blob([pdfBuffer], { type: "application/pdf" }), "agreement.pdf")

  const createRes = await fetch(`${cfg.apiUrl}/envelope/create`, {
    method: "POST",
    headers: authHeaders(cfg.apiKey),
    body: form,
  })
  if (!createRes.ok) {
    throw new Error(`Documenso create failed: ${await createRes.text()}`)
  }
  const created = (await createRes.json()) as { id: string }

  const distributeRes = await fetch(`${cfg.apiUrl}/envelope/distribute`, {
    method: "POST",
    headers: { ...authHeaders(cfg.apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({
      envelopeId: created.id,
      meta: { distributionMethod: "NONE" },
    }),
  })
  if (!distributeRes.ok) {
    throw new Error(`Documenso distribute failed: ${await distributeRes.text()}`)
  }
  const distributed = (await distributeRes.json()) as EnvelopeResponse
  const signingUrl = await getSigningUrl(created.id, recipientEmail, distributed)
  return { documentId: created.id, signingUrl }
}

export async function getSigningUrl(
  documentId: string,
  recipientEmail?: string,
  cached?: EnvelopeResponse,
): Promise<string | null> {
  const cfg = documensoConfig()
  if (!cfg) throw new Error("Documenso not configured")

  const envelope =
    cached ??
    ((await (
      await fetch(`${cfg.apiUrl}/envelope/${documentId}`, {
        headers: authHeaders(cfg.apiKey),
      })
    ).json()) as EnvelopeResponse)

  const recipients = envelope.recipients ?? []
  const match = recipientEmail
    ? recipients.find((r) => r.email.toLowerCase() === recipientEmail.toLowerCase())
    : recipients.find((r) => r.role === "SIGNER")
  return match?.signingUrl ?? null
}

export async function downloadSignedPdf(documentId: string): Promise<Buffer> {
  const cfg = documensoConfig()
  if (!cfg) throw new Error("Documenso not configured")

  const envelopeRes = await fetch(`${cfg.apiUrl}/envelope/${documentId}`, {
    headers: authHeaders(cfg.apiKey),
  })
  if (!envelopeRes.ok) throw new Error(`Documenso envelope fetch failed: ${await envelopeRes.text()}`)
  const envelope = (await envelopeRes.json()) as EnvelopeResponse
  if (envelope.status !== "COMPLETED") {
    throw new Error("Document is not completed")
  }
  const itemId = envelope.envelopeItems?.[0]?.id
  if (!itemId) throw new Error("No envelope item to download")

  const downloadRes = await fetch(
    `${cfg.apiUrl}/envelope/item/${itemId}/download?version=signed`,
    { headers: authHeaders(cfg.apiKey) },
  )
  if (!downloadRes.ok) throw new Error(`Documenso download failed: ${await downloadRes.text()}`)
  return Buffer.from(await downloadRes.arrayBuffer())
}

export function verifyWebhookSignature(receivedSecret: string | null, expectedSecret: string): boolean {
  if (!receivedSecret || !expectedSecret) return false
  const a = Buffer.from(receivedSecret, "utf8")
  const b = Buffer.from(expectedSecret, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export type DocumensoWebhookPayload = {
  id: string | number
  envelopeId?: string
  externalId?: string | null
  completedAt?: string | null
  Recipient?: {
    name?: string
    email?: string
    signedAt?: string | null
    signingStatus?: string
    envelopeId?: string
  }[]
}

export function extractSignatureFromWebhook(
  payload: DocumensoWebhookPayload,
): { name: string; position: string; date: string } {
  const signer =
    payload.Recipient?.find((r) => r.signingStatus === "SIGNED" && r.signedAt) ??
    payload.Recipient?.[0]
  const date = signer?.signedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  return {
    name: signer?.name ?? "Signed via Documenso",
    position: "Authorised signatory",
    date,
  }
}
