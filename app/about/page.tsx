import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LOGO, TRADEMARK_NOTICE, COMPANY, SEAMCOR_JOURNEY } from "@/lib/brand"
import { ArrowRight, Scale, Heart, Handshake, ShieldCheck, Sprout } from "lucide-react"

const values = [
  {
    icon: Scale,
    title: "Honesty",
    body: "Straight answers, fair pricing and no hidden surprises. We'd rather tell you what's right than what's easy.",
  },
  {
    icon: Handshake,
    title: "Fairness",
    body: "We treat customers the way we'd want to be treated — clear terms, real value and respect on both sides.",
  },
  {
    icon: Heart,
    title: "Equality",
    body: "Everyone deserves to be heard and helped, whether you're a multinational or a small enterprise.",
  },
  {
    icon: ShieldCheck,
    title: "Doing it properly",
    body: "Grown up technology means building things to last, supporting them well, and standing behind our word.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-24">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              About Us
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
              Built on principles, run by people who care.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Seamvex Data Systems Ltd is the company behind Seamcor — founded to do things a little
              differently.
            </p>
          </div>
        </section>

        {/* Founder */}
        <section className="bg-background">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
            <div className="grid items-center gap-12 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="rounded-3xl border border-border bg-secondary/50 p-8 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-3xl font-bold text-accent">
                    SM
                  </div>
                  <p className="mt-5 text-lg font-bold text-primary">Stephanie Meechan</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Founder &amp; Director
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Owns Seamvex Data Systems Ltd outright and is hands-on in the business every day.
                  </p>
                </div>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">Our story</p>
                <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                  A company built the right way
                </h2>
                <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Seamvex Data Systems Ltd was founded by Stephanie Meechan. After several years
                    working at the Ministry of Defence, she learned a great deal about how
                    organisations really run — and about the kind of company she wanted to build.
                  </p>
                  <p>
                    She took on Seamcor — software with nearly two decades of real-world use behind
                    it — and brought it under Seamvex with a simple promise: things would be done
                    properly, and the people using the software would always come first.
                  </p>
                  <p>
                    When you deal with Seamvex, you&apos;re dealing with a company that genuinely cares
                    about getting it right for you. Same trusted platform, same customers — just a
                    steadier, more personal way of running the business.
                  </p>
                </div>
              </div>
            </div>

            <blockquote className="mt-12 rounded-2xl border-l-4 border-accent bg-secondary/50 px-6 py-5 text-lg italic leading-relaxed text-primary">
              &ldquo;We don&apos;t need to be proved right or wrong. We just want to do good work, treat
              people fairly, and build something we&apos;re proud of.&rdquo;
            </blockquote>
          </div>
        </section>

        {/* The Seamcor Journey */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">The Seamcor Journey</p>
              <h2 className="mt-3 text-balance text-2xl font-bold text-primary sm:text-3xl">
                Same software philosophy. Better every step of the way.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                Seamcor did not appear overnight. It grew from years of building, listening and
                improving — with Seamvex as the latest chapter in that story.
              </p>
            </div>
            <ol className="relative mt-14 space-y-0">
              {SEAMCOR_JOURNEY.map((step, index) => (
                <li key={step.year} className="relative flex gap-5 pb-10 last:pb-0 sm:gap-8">
                  {index < SEAMCOR_JOURNEY.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[1.125rem] top-10 bottom-0 w-px bg-border sm:left-[1.375rem]"
                    />
                  )}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-background text-xs font-bold text-accent sm:h-11 sm:w-11 sm:text-sm">
                    {index === SEAMCOR_JOURNEY.length - 1 ? (
                      <Sprout className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent">{step.year}</p>
                    <h3 className="mt-1 text-lg font-bold text-primary">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Values */}
        <section className="border-y border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">What we believe in</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                These aren&apos;t just words on a page — they&apos;re how we choose to do business
                every day.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-card-foreground">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Company facts */}
        <section className="bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <div className="flex items-center justify-center">
              <Image
                src={LOGO.marketing.src}
                alt={LOGO.marketing.alt}
                width={LOGO.marketing.width}
                height={LOGO.marketing.height}
                className="h-auto w-full max-w-sm"
              />
            </div>
            <dl className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              <Fact label="Company" value={COMPANY.legalName} />
              <Fact label="Trading as" value={COMPANY.tradingName} />
              <Fact label="Company number" value={COMPANY.number} />
              <Fact label="Registered in" value={COMPANY.jurisdiction} />
              <Fact label="Registered office" value={COMPANY.registeredOffice.singleLine} />
              <Fact label="Nature of business" value={COMPANY.natureOfBusiness} />
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{TRADEMARK_NOTICE}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background pb-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="rounded-3xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10">
              <h2 className="text-balance text-2xl font-bold sm:text-3xl">Let&apos;s have a chat</h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
                No hard sell — just an honest conversation about how we can help.
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="font-medium text-card-foreground sm:text-right">{value}</dd>
    </div>
  )
}
