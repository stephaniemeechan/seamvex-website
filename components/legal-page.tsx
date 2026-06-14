import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LegalDocumentView } from "@/components/legal-document"
import type { LegalDocument } from "@/lib/legal/content"

type LegalPageProps = {
  document: LegalDocument
  badge: string
}

export function buildLegalMetadata(document: LegalDocument): Metadata {
  return {
    title: `${document.title} | Seamcor — Seamvex Data Systems Ltd`,
    description: document.description,
  }
}

export function LegalPage({ document, badge }: LegalPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
            <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              {badge}
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
              {document.title}
            </h1>
          </div>
        </section>
        <section className="bg-background pb-20">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <LegalDocumentView document={document} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
