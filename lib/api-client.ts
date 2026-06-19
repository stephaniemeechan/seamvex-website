let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  if (!csrfPromise) {
    csrfPromise = fetch("/api/auth/csrf")
      .then(async (r) => {
        const d = (await r.json()) as { token?: string; error?: string }
        if (!r.ok || !d.token) throw new Error(d.error ?? "CSRF fetch failed")
        csrfToken = d.token
        return d.token
      })
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = await getCsrfToken()
  const headers = new Headers(init?.headers)
  headers.set("x-csrf-token", token)
  const res = await fetch(input, { ...init, headers })
  if (res.status === 403) {
    csrfToken = null
    const retryToken = await getCsrfToken()
    headers.set("x-csrf-token", retryToken)
    return fetch(input, { ...init, headers })
  }
  return res
}
