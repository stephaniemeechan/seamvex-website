import { NextResponse } from "next/server"

export const runtime = "nodejs"

/** Twilio domain verification for seamvex.com */
export function GET() {
  return new NextResponse("twilio-domain-verification=531804029afb8ab9fd1af341c1cac943", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
