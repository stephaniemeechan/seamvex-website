import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/get-session"
import { canManageContracts } from "@/lib/auth/rbac"
import { getSetting } from "@/lib/db"

export const dynamic = "force-dynamic"

type ResourceLink = { label: string; url: string }

function parseResources(raw: string | null): ResourceLink[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ResourceLink =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ResourceLink).label === "string" &&
        typeof (item as ResourceLink).url === "string",
    )
  } catch {
    return []
  }
}

export default async function ResourcesPage() {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  if (!canManageContracts(session)) redirect("/admin")
  const resources = parseResources(await getSetting("resources"))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Resources</h1>
        <p className="mt-1 text-muted-foreground">Quick links to shared Drive folders and documents.</p>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          No resource links configured yet.{" "}
          <Link href="/admin/settings" className="text-accent hover:underline">
            Add links in Settings
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {resources.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center rounded-xl border border-border bg-card p-4 text-sm font-medium text-primary hover:bg-secondary/50"
              >
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
