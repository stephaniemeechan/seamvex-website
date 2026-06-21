import { AdminHeader } from "@/components/admin-header"
import { COMPANY } from "@/lib/brand"
import { getSession } from "@/lib/auth/get-session"

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader role={session?.role} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border px-4 py-4 sm:px-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          {COMPANY.legalName} is registered in {COMPANY.jurisdiction} (company number {COMPANY.number}),
          trading as {COMPANY.tradingName}. Registered office: {COMPANY.registeredOffice.singleLine}.
        </p>
      </footer>
    </div>
  )
}
