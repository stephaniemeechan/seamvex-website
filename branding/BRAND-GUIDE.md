# Seamcor / Seamvex brand guide

Practical reference for the website, documents, and Cloud Run deployment. Not a full corporate identity manual.

## Who is who

| Role | Name | Use |
|------|------|-----|
| **Registered company** | Seamvex Data Systems Ltd | Legal contracting party, invoices, contracts, website footer |
| **Trading / product brand** | Seamcor | Customer-facing software, marketing, UI, day-to-day comms |
| **Trademark & software** | Seamcor software and trademark | Seamvex is the exclusive distributor with the exclusive right to use the Seamcor trademark |

**Domains:** `seamvex.com` and `seamcor.com` both point at this site. Lead with **Seamcor** in the product experience; keep **Seamvex Data Systems Ltd** visible for legal disclosure.

Under [UK trading disclosure rules](https://www.legislation.gov.uk/uksi/2015/17/regulation/24/made), the registered company name must appear on websites and business correspondence. The trading name can dominate the logo; the legal name belongs in the footer, legal lockups, and formal documents.

## Two logo sets

### 1. Marketing lockup (`seamcor-marketing.*`)

**Use:** website header, hero, sales decks, social, product UI.

Contains:
- SEAMCOR wordmark
- “Grown Up Technology” tagline

Does **not** include the legal entity line.

### 2. Legal lockup (`seamcor-legal.*`)

**Use:** contracts, invoices, letterheads, proposals, PDFs, email signatures for formal comms.

Contains (top → bottom):
1. `Seamvex Data Systems Ltd - trading as` (small, grey — stops here; no repeat of the brand name)
2. SEAMCOR wordmark (this *is* the trading name)
3. “Grown Up Technology” tagline

**Why legal line on top:** On formal documents, the contracting party should be read first, then the brand customers recognise. Footer-only disclosure satisfies the website rule; the legal lockup is for documents where the logo is the header.

## Colour palette

| Name | Hex | Use |
|------|-----|-----|
| Seamcor Navy | `#1B2A4E` | Wordmark, headings, primary UI |
| Seamcor Pink | `#E5007D` | Accent, CTAs, logo highlights (A/O) |
| Slate | `#5C6B7A` | Tagline, secondary text |
| Light grey | `#94A3B8` | Legal line, captions |
| White | `#FFFFFF` | Backgrounds |
| Off-white | `#F8FAFC` | Section backgrounds |

Website CSS already maps these via `--primary`, `--accent`, and `--muted-foreground` in `app/globals.css`.

## Typography

| Use | Font | Fallback |
|-----|------|----------|
| UI & body | [Geist Sans](https://vercel.com/font) | system-ui, sans-serif |
| Code / mono | Geist Mono | monospace |
| Logo wordmark | Bold geometric sans (Arial Black / Helvetica Neue Bold style) | sans-serif |

Logo files use **Outfit** or system bold sans in SVG exports; the live site uses **Geist** for a cleaner web stack. Keep logo type and UI type separate — do not set the whole site to the logo face.

## File inventory

```
branding/
├── BRAND-GUIDE.md
├── build-logos.ps1          # rebuild PNGs from master
├── make-transparent.ps1     # transparent variants
├── audit-logos.ps1          # pixel-verify crops
└── logos/
    ├── seamcor-marketing.png              (1601×390, white)
    ├── seamcor-marketing-transparent.png  (1601×390, transparent)
    ├── seamcor-marketing.svg
    ├── seamcor-legal.png                  (1601×430, white)
    ├── seamcor-legal-transparent.png      (1601×430, transparent)
    ├── seamcor-legal.svg
    ├── seamcor-icon.png                   (1601×235, wordmark only, white)
    └── seamcor-icon.svg
```

**Master source:** `public/seamcor-logo.png` (1601×502). All PNGs are pixel-cropped from this file — never AI-regenerated.

**Verified (pixel audit):**
- `seamcor-marketing.png` — 0 mismatches vs master rows 0–389; includes tagline; excludes legal footer
- `seamcor-icon.png` — 0 mismatches vs master rows 0–234; wordmark only (tagline starts ~y300)
- `seamcor-legal.png` — marketing section 0 mismatches vs `seamcor-marketing.png`; legal line on top

## Usage rules

**Do**
- Use marketing lockup in header and hero.
- Use legal lockup on PDFs and contract covers.
- Keep minimum clear space around the wordmark equal to the height of the “S”.
- Use transparent PNG/SVG on coloured backgrounds.

**Don’t**
- Stretch or recolour the wordmark.
- Drop the legal line from invoices or contracts.
- Imply Seamvex owns the Seamcor trademark without the reseller acknowledgement.
- Put the long legal line in the website header — footer + dedicated legal pages are enough.

## Website mapping (next step)

| Location | Asset |
|----------|-------|
| Header | `/logos/seamcor-marketing.png` |
| Footer (dark background) | `/logos/seamcor-marketing.png` on white chip |
| Hero / About | `/logos/seamcor-marketing.png` |
| Favicon | `/logos/seamcor-icon.png` |
| Legal PDFs | `/logos/seamcor-legal.png` |

Website assets live in `public/logos/`. Paths and copy are centralised in `lib/brand.ts`.

## Rebuilding logos

All PNGs are cropped from `public/seamcor-logo.png` (the correct master with proper A/O accents). Do not use AI-regenerated versions.

```powershell
powershell -ExecutionPolicy Bypass -File branding/build-logos.ps1
powershell -ExecutionPolicy Bypass -File branding/make-transparent.ps1
powershell -ExecutionPolicy Bypass -File branding/audit-logos.ps1
```
