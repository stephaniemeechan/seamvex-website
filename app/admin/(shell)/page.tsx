import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { canManageContracts } from "@/lib/auth/rbac"
import { listContracts, listOrders } from "@/lib/proposals/orders"
import { xeroConfig } from "@/lib/xero/client"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ xero?: string }>
}) {
  const params = Promise.resolve(searchParams)
  return <DashboardInner searchParams={params} />
}

async function DashboardInner({
  searchParams,
}: {
  searchParams: Promise<{ xero?: string }>
}) {
  const sp = await searchParams
  const session = await getSession()
  if (!session) redirect("/admin/login")
  const isAdmin = canManageContracts(session)
  const orders = await listOrders()
  const contracts = await listContracts()
  const signed = contracts.filter((c) => c.rolloutStatus === "signed").length
  const pending = contracts.length - signed
  const xeroReady = Boolean(xeroConfig())

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Customer agreements</h1>
          <p className="mt-1 text-muted-foreground">
            Proposal → contract → sign. Pricing from spreadsheet rules; customer from Xero.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!xeroReady ? (
              <span className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Add Xero credentials to .env.local
              </span>
            ) : (
              <a
                href="/api/xero/connect"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                Connect Xero
              </a>
            )}
            <Link
              href="/admin/orders/new"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              New agreement
            </Link>
          </div>
        )}
      </div>

      {sp.xero === "connected" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-900">
          Xero connected successfully.
        </p>
      )}
      {sp.xero === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          Xero connection failed. Check credentials and redirect URI.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Customers tracked</p>
          <p className="mt-1 text-3xl font-bold text-primary">{contracts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Signed</p>
          <p className="mt-1 text-3xl font-bold text-primary">{signed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pending re-sign</p>
          <p className="mt-1 text-3xl font-bold text-primary">{pending}</p>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6">
          <h2 className="text-lg font-semibold text-primary">Get started</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong>Connect Xero</strong> and pick a customer (production path)
            </li>
            <li>
              <strong>New agreement</strong> → build lines → save proposal → download proposal PDF
            </li>
            <li>Generate contract → send (Documenso + Gmail) → customer signs → DRAFT invoice in Xero</li>
          </ol>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-primary">Recent orders</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Document</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No orders yet — connect Xero and create a new agreement.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{o.documentNumber}</td>
                  <td className="px-4 py-2">{o.customer.companyName}</td>
                  <td className="px-4 py-2 capitalize">{o.orderType}</td>
                  <td className="px-4 py-2 capitalize">{o.status}</td>
                  <td className="px-4 py-2">
                    {o.orderTotal != null ? o.orderTotal.toFixed(2) : "—"} {o.currency}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-accent hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
