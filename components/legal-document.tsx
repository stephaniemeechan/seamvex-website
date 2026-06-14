import Link from "next/link"
import type { LegalDocument } from "@/lib/legal/content"
import { LEGAL, TRADEMARK_NOTICE } from "@/lib/brand"

type LegalDocumentViewProps = {
  document: LegalDocument
}

export function LegalDocumentView({ document }: LegalDocumentViewProps) {
  return (
    <article className="prose-legal">
      <p className="text-sm text-muted-foreground">Last updated: {document.lastUpdated}</p>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{document.description}</p>

      <nav className="mt-8 rounded-2xl border border-border bg-secondary/40 p-5" aria-label="On this page">
        <p className="text-sm font-semibold text-primary">On this page</p>
        <ol className="mt-3 space-y-2 text-sm">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-muted-foreground transition-colors hover:text-accent">
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-bold text-primary">{section.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-2 pl-6">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          See also:{" "}
          <Link href={LEGAL.privacy} className="text-accent hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href={LEGAL.cookies} className="text-accent hover:underline">
            Cookie Policy
          </Link>
          {" · "}
          <Link href={LEGAL.terms} className="text-accent hover:underline">
            Website Terms
          </Link>
        </p>
        <p className="mt-4">{TRADEMARK_NOTICE}</p>
      </footer>
    </article>
  )
}
