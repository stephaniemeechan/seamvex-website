const DEFAULT_ADMIN_EMAILS = ["s.meechan@seamvex.com", "j.cyprus@seamvex.com"]

/** Comma-separated ADMIN_EMAIL — each listed @seamvex.com user gets admin on first Google sign-in. */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL?.trim()
  const source = raw || DEFAULT_ADMIN_EMAILS.join(",")
  return source
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase())
}
