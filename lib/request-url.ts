import { appBaseUrl } from "@/lib/env"

/** Public site origin for redirects (Cloud Run passes x-forwarded-*; request.url may be 0.0.0.0:8080). */
export function publicOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")

  if (forwardedProto && forwardedHost && !forwardedHost.startsWith("0.0.0.0")) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return appBaseUrl().replace(/\/$/, "")
}

export function publicUrl(request: Request, pathname: string): URL {
  return new URL(pathname, publicOrigin(request))
}
