import { Suspense } from "react"
import { TicketsListClient } from "@/components/tickets-list-client"

export const dynamic = "force-dynamic"

export default function TicketsPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <TicketsListClient />
    </Suspense>
  )
}
