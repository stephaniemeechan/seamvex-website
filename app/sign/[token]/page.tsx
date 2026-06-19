"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { COMPANY, LOGO } from "@/lib/brand"

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("")
  const [order, setOrder] = useState<{
    id: string
    documentNumber: string
    customer: { companyName: string }
    status: string
  } | null>(null)
  const [signed, setSigned] = useState(false)
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [poNumber, setPoNumber] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then((p) => {
      setToken(p.token)
      fetch(`/api/sign/${p.token}`)
        .then((r) => r.json())
        .then((d) => {
          setOrder(d.order)
          setSigned(d.signed)
        })
    })
  }, [params])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const res = await fetch(`/api/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, position, date, poNumber, acceptedTerms }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? "Sign failed")
      return
    }
    setSigned(true)
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading agreement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Image src={LOGO.marketing.src} alt={LOGO.marketing.alt} width={160} height={40} className="h-12 w-auto" />
      </header>
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {signed ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <h1 className="text-xl font-bold text-primary">Agreement signed</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you. {order.documentNumber} for {order.customer.companyName} is complete.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-primary">Sign Software Agreement</h1>
            <p className="mt-1 text-muted-foreground">
              {order.documentNumber} — {order.customer.companyName}
            </p>
            <p className="mt-4 text-sm">
              <a
                href={`/api/sign/${token}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                Download agreement PDF
              </a>{" "}
              before signing.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input
                  required
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Position</label>
                <input
                  required
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">PO number (optional)</label>
                <input
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read the Terms and Conditions and{" "}
                  <a
                    href={`/api/sign/${token}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Seamcor terms
                  </a>
                  .
                </span>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-accent py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {submitting ? "Signing…" : "Sign agreement"}
              </button>
            </form>
          </>
        )}
        <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          {COMPANY.legalName} (company {COMPANY.number}), trading as {COMPANY.tradingName}
        </footer>
      </main>
    </div>
  )
}
