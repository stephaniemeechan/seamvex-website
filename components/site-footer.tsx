import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin } from "lucide-react"
import { FooterLegalLinks } from "@/components/footer-legal-links"
import { COMPANY, CONTACT, LOGO, TAGLINE, TRADEMARK_NOTICE } from "@/lib/brand"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-block rounded-lg bg-background px-4 py-3">
            <Image
              src={LOGO.marketing.src}
              alt={LOGO.marketing.alt}
              width={LOGO.marketing.width}
              height={LOGO.marketing.height}
              className="h-12 w-auto"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {COMPANY.legalName}, trading as {COMPANY.tradingName}. {TAGLINE}, run on honest,
            straightforward principles.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-primary-foreground/60">
            Registered in {COMPANY.jurisdiction}. Company number {COMPANY.number}.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/90">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-primary-foreground/70 transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li>
              <Link href="/services" className="text-primary-foreground/70 transition-colors hover:text-accent">
                Services &amp; Software
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-primary-foreground/70 transition-colors hover:text-accent">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-primary-foreground/70 transition-colors hover:text-accent">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/90">
            Legal
          </h3>
          <FooterLegalLinks />
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/90">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{COMPANY.registeredOffice.singleLine}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-accent">
                {CONTACT.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${CONTACT.sales}`} className="transition-colors hover:text-accent">
                {CONTACT.sales}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${CONTACT.support}`} className="transition-colors hover:text-accent">
                {CONTACT.support}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${CONTACT.accounts}`} className="transition-colors hover:text-accent">
                {CONTACT.accounts}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-3">
            <p>
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved. {COMPANY.legalName} is
              registered in {COMPANY.jurisdiction} (company number {COMPANY.number}), trading as {COMPANY.tradingName}.
              Registered office: {COMPANY.registeredOffice.singleLine}.
            </p>
            <p>{TRADEMARK_NOTICE}</p>
          </div>
          <Link
            href="/admin/login"
            className="shrink-0 self-start rounded-md border border-primary-foreground/20 px-3 py-1.5 text-xs font-medium text-primary-foreground/80 transition-colors hover:border-accent hover:text-accent sm:self-center"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
