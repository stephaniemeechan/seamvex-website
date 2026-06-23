import { OAuth2Client } from "google-auth-library"

const BASE_SCOPES = ["openid", "email", "profile"]
const OPTIONAL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.file",
]

export type GoogleConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function googleOAuthClient(): OAuth2Client | null {
  const cfg = googleConfig()
  if (!cfg) return null
  return new OAuth2Client(cfg.clientId, cfg.clientSecret, cfg.redirectUri)
}

export const GOOGLE_LOGIN_SCOPES = [...BASE_SCOPES]
export const GOOGLE_SCOPES = [...BASE_SCOPES, ...OPTIONAL_SCOPES]

export function googleAuthorizeUrl(state: string): string {
  const client = googleOAuthClient()
  if (!client) throw new Error("Google OAuth not configured")
  return client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_LOGIN_SCOPES,
    state,
    prompt: "select_account",
    include_granted_scopes: true,
  })
}

export type GoogleProfile = {
  sub: string
  email: string
  name: string
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const cfg = googleConfig()
  const client = googleOAuthClient()
  if (!cfg || !client) throw new Error("Google OAuth not configured")

  const { tokens } = await client.getToken({
    code,
    redirect_uri: cfg.redirectUri,
  })
  if (!tokens.id_token) throw new Error("Missing Google ID token")

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: cfg.clientId,
  })
  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email) throw new Error("Invalid Google profile")

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split("@")[0] ?? "User",
  }
}
