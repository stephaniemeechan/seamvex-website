import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin } from "lucide-react"
import { CONTACT, LOGO, TRADEMARK_NOTICE } from "@/lib/brand"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
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
            Seamvex Data Systems Ltd, trading as Seamcor. Grown up technology, run on honest,
            straightforward principles.
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
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>Church Court, Stourbridge Road, Halesowen, England, B63 3TT</span>
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} Seamvex Data Systems Ltd. All rights reserved.</p>
          <p>{TRADEMARK_NOTICE}</p>
        </div>
      </div>
    </footer>
  )
}
