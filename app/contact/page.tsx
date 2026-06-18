import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { COMPANY, CONTACT, CUSTOMER_REASSURANCE, PRODUCT_IMAGES } from "@/lib/brand"
import { Phone, Mail, MapPin, Clock, User, LifeBuoy, Receipt, ArrowRight } from "lucide-react"

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
              Have a question about Seamcor, or want a direct conversation with Stephanie? Reply by
              email or phone — no jargon, no hard sell.
            </p>
          </div>
        </section>

        {/* Existing customers reassurance */}
        <section className="border-b border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                  Already a Seamcor customer?
                </p>
                <h2 className="mt-3 text-balance text-2xl font-bold text-primary sm:text-3xl">
                  {CUSTOMER_REASSURANCE.headline}
                </h2>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  {CUSTOMER_REASSURANCE.intro}
                </p>
                <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {CUSTOMER_REASSURANCE.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  <strong className="font-semibold text-primary">Stephanie Meechan</strong>, Founder
                  &amp; Director, is happy to speak to anyone who would like a direct conversation.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.taskBuilder.src}
                  alt={PRODUCT_IMAGES.taskBuilder.alt}
                  width={PRODUCT_IMAGES.taskBuilder.width}
                  height={PRODUCT_IMAGES.taskBuilder.height}
                  className="h-auto w-full"
                />
              </div>
            </div>
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
                  lines={COMPANY.registeredOffice.lines}
                />
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {COMPANY.legalName}, trading as {COMPANY.tradingName} (company number{" "}
                {COMPANY.number}).
              </p>
              <Link
                href="/about"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent"
              >
                About Seamvex and Seamcor
                <ArrowRight className="h-4 w-4" />
              </Link>
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
