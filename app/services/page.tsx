import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PRODUCT_IMAGES } from "@/lib/brand"
import {
  ArrowRight,
  Cloud,
  Server,
  Smartphone,
  Headphones,
  UserCog,
  Settings,
  Lightbulb,
  Check,
} from "lucide-react"

const useCases = [
  "Production",
  "Supplier",
  "Quality",
  "HR",
  "Risk",
  "Preventative Maintenance",
  "Fleet",
  "Asset",
  "Health & Safety",
  "Lab",
  "Staff Training",
  "Legal Case",
  "Privacy",
  "Sustainability",
  "Document Repository",
]

const deployment = [
  {
    icon: Cloud,
    title: "Seamcor Cloud",
    body: "A hassle-free, secure way to use Seamcor with zero overhead. Hosted on Microsoft Azure with high availability, daily backups and real-time monitoring.",
  },
  {
    icon: Server,
    title: "On-prem or Private Cloud",
    body: "For specific data or security needs, deploy within your own data centres. Runs anywhere managing containerised workloads, like Docker and Kubernetes.",
  },
  {
    icon: Smartphone,
    title: "Web & mobile",
    body: "Use Seamcor in any modern browser, or the native Android app. The iOS app for iPhone and iPad is on the way.",
  },
]

const services = [
  {
    icon: UserCog,
    title: "Account Management",
    body: "A dedicated, seasoned account manager who understands your business and makes sure you get the best return on your investment.",
  },
  {
    icon: Settings,
    title: "Fully Managed Service",
    body: "Online installation and configuration, system reviews, custom database and task setup, and thorough online training.",
  },
  {
    icon: Lightbulb,
    title: "Consultancy",
    body: "Gap analysis on current processes, advice on business compliance, and reviews of external audit reports from our industry experts.",
  },
]

const benefits = [
  "Enhanced data management with secure document storage",
  "A clear, structured organisational view",
  "Precise, secure user access control",
  "Tailored forms and tasks across any device",
  "Streamlined, automated workflows",
  "Increased productivity with less manual effort",
]

export default function ServicesPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-24">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Services &amp; Software
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
              Collect, process, store and share your business information.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              A fully customisable Business Information &amp; Workflow Management system, designed to
              work for any organisation.
            </p>
          </div>
        </section>

        {/* Core capability detail */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary sm:text-3xl">
                  Built around how you actually work
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Administrators create tailored data tables for each area of the business, with
                  validation, workflow automation, email alerts and integration between tables. Each
                  department gets controlled, secure access to exactly the data it needs.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Build custom forms and tasks for data capture on any device, scheduled or assigned
                  to individuals or groups, with triggers, alerts, photos, videos and signatures.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.departmentOverview.src}
                  alt={PRODUCT_IMAGES.departmentOverview.alt}
                  width={PRODUCT_IMAGES.departmentOverview.width}
                  height={PRODUCT_IMAGES.departmentOverview.height}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-7">
              <h3 className="font-semibold text-primary">The benefits, in short</h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">
                One platform, many areas of the business
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Because it&apos;s fully customisable, Seamcor adapts to a wide range of functions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {useCases.map((u) => (
                <span
                  key={u}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {u}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Deployment */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">Deploy it your way</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Managed cloud, your own infrastructure, or across web and mobile — whatever suits your
                data and security needs.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {deployment.map((d) => (
                <div
                  key={d.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <d.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-card-foreground">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src={PRODUCT_IMAGES.mobileTrio.src}
                alt={PRODUCT_IMAGES.mobileTrio.alt}
                width={PRODUCT_IMAGES.mobileTrio.width}
                height={PRODUCT_IMAGES.mobileTrio.height}
                className="h-auto w-full"
              />
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <Image
                  src={PRODUCT_IMAGES.mobileTaskList.src}
                  alt={PRODUCT_IMAGES.mobileTaskList.alt}
                  width={PRODUCT_IMAGES.mobileTaskList.width}
                  height={PRODUCT_IMAGES.mobileTaskList.height}
                  className="h-auto w-full max-w-[280px]"
                />
              </div>
              <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                <Image
                  src={PRODUCT_IMAGES.mobileCompliance.src}
                  alt={PRODUCT_IMAGES.mobileCompliance.alt}
                  width={PRODUCT_IMAGES.mobileCompliance.width}
                  height={PRODUCT_IMAGES.mobileCompliance.height}
                  className="h-auto w-full max-w-[280px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* See it in action */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">See it in action</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                From auditing and device registration to mobile field capture and department
                reports — the same workflows your teams already rely on.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.auditingDashboard.src}
                  alt={PRODUCT_IMAGES.auditingDashboard.alt}
                  width={PRODUCT_IMAGES.auditingDashboard.width}
                  height={PRODUCT_IMAGES.auditingDashboard.height}
                  className="h-auto w-full"
                />
                <figcaption className="p-4 text-sm font-medium text-muted-foreground">
                  Auditing with department filters and task sessions
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.pdaRegistration.src}
                  alt={PRODUCT_IMAGES.pdaRegistration.alt}
                  width={PRODUCT_IMAGES.pdaRegistration.width}
                  height={PRODUCT_IMAGES.pdaRegistration.height}
                  className="h-auto w-full"
                />
                <figcaption className="p-4 text-sm font-medium text-muted-foreground">
                  Device registration for handheld and field equipment
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.analyticsReport.src}
                  alt={PRODUCT_IMAGES.analyticsReport.alt}
                  width={PRODUCT_IMAGES.analyticsReport.width}
                  height={PRODUCT_IMAGES.analyticsReport.height}
                  className="h-auto w-full"
                />
                <figcaption className="p-4 text-sm font-medium text-muted-foreground">
                  Department analysis reports with non-conformance metrics
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image
                  src={PRODUCT_IMAGES.complianceForm.src}
                  alt={PRODUCT_IMAGES.complianceForm.alt}
                  width={PRODUCT_IMAGES.complianceForm.width}
                  height={PRODUCT_IMAGES.complianceForm.height}
                  className="h-auto w-full"
                />
                <figcaption className="p-4 text-sm font-medium text-muted-foreground">
                  Compliance tasks with photos, checklists and signatures
                </figcaption>
              </figure>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src={PRODUCT_IMAGES.taskBuilder.src}
                alt={PRODUCT_IMAGES.taskBuilder.alt}
                width={PRODUCT_IMAGES.taskBuilder.width}
                height={PRODUCT_IMAGES.taskBuilder.height}
                className="h-auto w-full"
              />
              <p className="border-t border-border p-4 text-sm font-medium text-muted-foreground">
                Task builder — validation rules and workflow triggers
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">More than just software</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Three core service offerings to help you get the most out of Seamcor.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-card-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Headphones className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-primary">Premium support, included</h2>
              <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground">
                Premium support seven days a week from 8:00 to 20:00 (excluding Christmas Day).
                Updates, upgrades, issue resolution and remote assistance are all included in the
                software rental — no additional cost.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background pb-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="rounded-3xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10">
              <h2 className="text-balance text-2xl font-bold sm:text-3xl">Tell us about your business</h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
                We&apos;ll show you how Seamcor can be tailored to fit the way you work.
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
