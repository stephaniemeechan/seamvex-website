import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LOGO, TESTIMONIALS } from "@/lib/brand"
import { ArrowRight, Table2, ShieldCheck, Workflow, Smartphone, Clock, Quote } from "lucide-react"

const capabilities = [
  {
    icon: Table2,
    title: "Customisable data tables",
    body: "Tailored tables for every part of the business, with validation, alerts and secure document storage.",
  },
  {
    icon: ShieldCheck,
    title: "Secure access control",
    body: "Precise control over who can view, edit or manage each set of data — accountable and safe.",
  },
  {
    icon: Workflow,
    title: "Streamlined workflows",
    body: "Centralise information and automate repetitive work for faster decisions and less manual effort.",
  },
  {
    icon: Smartphone,
    title: "Works on the go",
    body: "Any modern browser plus a native mobile app, so your team can capture data anywhere.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
            <div>
              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Grown Up Technology
              </span>
              <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-primary sm:text-5xl lg:text-6xl">
                Your whole business, managed in real time.
              </h1>
              <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                Seamcor is a fully customisable Business Information &amp; Workflow Management system —
                collect, process, store and share consistent information across every department, on
                any device.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
                >
                  Explore the software
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
                >
                  Get in touch
                </Link>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative rounded-3xl border border-border bg-card p-10 shadow-sm">
                <div className="absolute inset-x-8 -bottom-px h-px bg-accent/40" />
                <Image
                  src={LOGO.marketing.src}
                  alt={LOGO.marketing.alt}
                  width={LOGO.marketing.width}
                  height={LOGO.marketing.height}
                  priority
                  className="h-auto w-full max-w-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Intro statement */}
        <section className="bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Built around you</p>
            <h2 className="mt-3 text-balance text-2xl font-bold text-primary sm:text-3xl">
              Software designed to fit your organisation — not the other way around.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
              We tailor solutions to your distinct requirements rather than imposing a
              one-size-fits-all approach. Whatever your industry, Seamcor adapts to the way you
              already work.
            </p>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">What Seamcor does</h2>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                One adaptable system to centralise your data and streamline how work gets done.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-card-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support strip */}
        <section className="bg-background">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Premium support, seven days a week</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Support from 8:00 to 20:00 every day (excluding Christmas Day), including updates,
                  upgrades, issue resolution and remote assistance — all included.
                </p>
              </div>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              See services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Trusted by teams that can&apos;t cut corners
            </h2>
            <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              From retail to food production, organisations rely on Seamcor to keep compliance and
              operations running in real time.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} className="flex flex-col rounded-2xl border border-border bg-card p-7">
                  <Quote className="h-7 w-7 text-accent" />
                  <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-card-foreground">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border pt-4">
                    <p className="font-semibold text-primary">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
            <div className="rounded-3xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10">
              <h2 className="text-balance text-2xl font-bold sm:text-3xl">
                Ready to see what Seamcor can do for you?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
                No pressure, no jargon. Just an honest conversation about whether we&apos;re the right
                fit for your business.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
              >
                Get in touch
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
