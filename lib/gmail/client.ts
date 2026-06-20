import { OAuth2Client } from "google-auth-library"
import { execute, ensureDb, newId, queryOne } from "@/lib/db"
import { decryptToken, encryptToken } from "@/lib/auth/tokens"
import { googleOAuthClient } from "@/lib/auth/google"
import { getUserById } from "@/lib/crm/users"

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

export function gmailConnectUrl(state: string): string {
  const client = googleOAuthClient()
  if (!client) throw new Error("Google OAuth not configured")
  const redirectUri =
    process.env.GMAIL_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/gmail/connect/callback`
  return client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    state,
    prompt: "consent",
    redirect_uri: redirectUri,
  })
}

export async function saveGmailRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await ensureDb()
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO user_gmail_tokens (user_id, refresh_token_enc, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET refresh_token_enc = excluded.refresh_token_enc, updated_at = excluded.updated_at`,
    [userId, encryptToken(refreshToken), now],
  )
}

export async function hasGmailRefreshToken(userId: string): Promise<boolean> {
  await ensureDb()
  const row = await queryOne<{ user_id: string }>(
    "SELECT user_id FROM user_gmail_tokens WHERE user_id = ?",
    [userId],
  )
  return Boolean(row)
}

async function gmailClientForUser(userId: string): Promise<OAuth2Client> {
  await ensureDb()
  const tokenRow = await queryOne<{ refresh_token_enc: string }>(
    "SELECT refresh_token_enc FROM user_gmail_tokens WHERE user_id = ?",
    [userId],
  )
  if (!tokenRow) throw new Error("Gmail not connected for user")

  const client = googleOAuthClient()
  if (!client) throw new Error("Google OAuth not configured")
  client.setCredentials({ refresh_token: decryptToken(tokenRow.refresh_token_enc) })
  return client
}

export async function sendEmail(
  userId: string,
  input: { to: string; subject: string; body: string; threadId?: string },
): Promise<{ messageId: string; threadId: string }> {
  const client = await gmailClientForUser(userId)
  const { token } = await client.getAccessToken()
  if (!token) throw new Error("Failed to obtain Gmail access token")

  const user = await getUserById(userId)
  if (!user) throw new Error("User not found")
  const displayName = (user.name ?? user.email.split("@")[0]).replace(/"/g, '\\"')
  const from = `"${displayName} (Seamcor)" <${user.email}>`

  const message = [
    `From: ${from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n")

  const encoded = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encoded,
      threadId: input.threadId,
    }),
  })
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`)
  const data = (await res.json()) as { id: string; threadId: string }
  return { messageId: data.id, threadId: data.threadId }
}

export async function logSentEmail(input: {
  sentByUserId: string
  toEmail: string
  subject: string
  gmailMessageId: string
  threadId?: string
  orderId?: string
  ticketId?: string
}): Promise<void> {
  await ensureDb()
  await execute(
    `INSERT INTO email_log (id, sent_by_user_id, order_id, ticket_id, to_email, subject, gmail_message_id, thread_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("eml"),
      input.sentByUserId,
      input.orderId ?? null,
      input.ticketId ?? null,
      input.toEmail,
      input.subject,
      input.gmailMessageId,
      input.threadId ?? null,
      new Date().toISOString(),
    ],
  )
}
