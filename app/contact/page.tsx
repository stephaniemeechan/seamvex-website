import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
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
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <ContactCard
                  icon={Mail}
                  label="General enquiries"
                  lines={["hello@seamcor.com"]}
                  href="mailto:hello@seamcor.com"
                />
                <ContactCard
                  icon={LifeBuoy}
                  label="Support"
                  lines={["support@seamcor.com"]}
                  href="mailto:support@seamcor.com"
                />
                <ContactCard
                  icon={Receipt}
                  label="Accounts"
                  lines={["accounts@seamcor.com"]}
                  href="mailto:accounts@seamcor.com"
                />
                <ContactCard icon={Phone} label="Phone" lines={["+44 7392 991808"]} href="tel:+447392991808" />
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

              {/* Contact form */}
              <div className="rounded-3xl border border-border bg-secondary/50 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-primary">Send us a message</h2>
                <p className="mt-1 text-sm text-muted-foreground">We&apos;ll reply as soon as we can.</p>
                <form className="mt-6 space-y-4">
                  <Field id="name" label="Name">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus:ring-2"
                    />
                  </Field>
                  <Field id="email" label="Email">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus:ring-2"
                    />
                  </Field>
                  <Field id="company" label="Company (optional)">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus:ring-2"
                    />
                  </Field>
                  <Field id="message" label="Message">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus:ring-2"
                    />
                  </Field>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
                  >
                    Send message
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Prefer to talk? Call us on{" "}
                    <a href="tel:+447392991808" className="font-medium text-accent hover:underline">
                      +44 7392 991808
                    </a>
                    .
                  </p>
                </form>
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

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-primary">
        {label}
      </label>
      {children}
    </div>
  )
}
