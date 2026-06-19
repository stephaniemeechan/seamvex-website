import { TicketDetailClient } from "@/components/ticket-detail-client"

export const dynamic = "force-dynamic"

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TicketDetailClient id={id} />
}
