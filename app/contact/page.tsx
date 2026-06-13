import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CONTACT } from "@/lib/brand"
import { Phone, Mail, MapPin, Clock, User, LifeBuoy, Receipt } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-24">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Contact
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
              Get in touch — we&apos;ll keep it simple.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Have a question about Seamcor or want to see whether it fits your business? Reach out
              and we&apos;ll get back to you.
            </p>
          </div>
        </section>

        {/* Contact details */}
        <section className="bg-background pb-20">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactCard
                icon={Mail}
                label="Sales"
                lines={[CONTACT.sales]}
                href={`mailto:${CONTACT.sales}`}
              />
              <ContactCard
                icon={LifeBuoy}
                label="Support"
                lines={[CONTACT.support]}
                href={`mailto:${CONTACT.support}`}
              />
              <ContactCard
                icon={Receipt}
                label="Accounts"
                lines={[CONTACT.accounts]}
                href={`mailto:${CONTACT.accounts}`}
              />
              <ContactCard
                icon={Phone}
                label="Phone"
                lines={[CONTACT.phone]}
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
              />
              <ContactCard icon={User} label="Director" lines={["Stephanie Meechan"]} />
              <ContactCard icon={Clock} label="Support hours" lines={["7 days a week", "8:00 – 20:00"]} />
              <div className="sm:col-span-2">
                <ContactCard
                  icon={MapPin}
                  label="Registered office"
                  lines={["Church Court, Stourbridge Road,", "Halesowen, England, B63 3TT"]}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function ContactCard({
  icon: Icon,
  label,
  lines,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  lines: string[]
  href?: string
}) {
  const content = (
    <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold text-card-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
  if (href) {
    return (
      <a href={href} className="block h-full">
        {content}
      </a>
    )
  }
  return content
}
