import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

function encryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === "production") {
    if (!secret) throw new Error("SESSION_SECRET is required in production")
    return scryptSync(secret, "seamvex-token-salt", 32)
  }
  const fallback = secret ?? process.env.ADMIN_PASSWORD ?? "dev-secret-change-me"
  return scryptSync(fallback, "seamvex-token-salt", 32)
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`
}

export function decryptToken(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(".")
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted token")
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const data = Buffer.from(dataB64, "base64")
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}
