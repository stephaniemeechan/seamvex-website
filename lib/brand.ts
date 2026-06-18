export const LOGO = {
  marketing: {
    src: "/logos/seamcor-marketing.png",
    width: 1601,
    height: 390,
    alt: "Seamcor — Grown Up Technology",
  },
  marketingTransparent: {
    src: "/logos/seamcor-marketing-transparent.png",
    width: 1601,
    height: 390,
    alt: "Seamcor — Grown Up Technology",
  },
  legal: {
    src: "/logos/seamcor-legal.png",
    width: 1601,
    height: 430,
    alt: "Seamvex Data Systems Ltd trading as Seamcor — Grown Up Technology",
  },
  legalTransparent: {
    src: "/logos/seamcor-legal-transparent.png",
    width: 1601,
    height: 430,
    alt: "Seamvex Data Systems Ltd trading as Seamcor — Grown Up Technology",
  },
  icon: {
    src: "/logos/seamcor-icon.png",
    width: 1601,
    height: 235,
    alt: "Seamcor",
  },
} as const

export const PRODUCT_IMAGES = {
  auditingDashboard: {
    src: "/images/product/auditing-dashboard.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor auditing screen with department filters and task grid — familiar workflow layout",
  },
  multiDevice: {
    src: "/images/product/multi-device.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor on desktop, laptop, mobile and tablet — compliance tasks, My Business and task builder",
  },
  mobileTrio: {
    src: "/images/product/mobile-trio.png",
    width: 1600,
    height: 900,
    alt: "Seamcor mobile app — task menu, compliance forms and product specification capture",
  },
  pdaRegistration: {
    src: "/images/product/pda-registration.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor device registration screen for managing handheld and field devices",
  },
  featuresIsometric: {
    src: "/images/product/features-isometric.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor capabilities — data tables, departments, access control and custom forms",
  },
  complianceForm: {
    src: "/images/product/compliance-form.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor compliance task form with checklist, photo capture and signature",
  },
  mobileTaskList: {
    src: "/images/product/mobile-task-list.png",
    width: 800,
    height: 1600,
    alt: "Seamcor mobile app showing assigned tasks list",
  },
  mobileCompliance: {
    src: "/images/product/mobile-compliance.png",
    width: 800,
    height: 1600,
    alt: "Seamcor mobile compliance checklist with pass/fail and submit",
  },
  tabletTask: {
    src: "/images/product/tablet-task.png",
    width: 1200,
    height: 900,
    alt: "Seamcor tablet field inspection checklist",
  },
  taskBuilder: {
    src: "/images/product/task-builder.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor task builder with validation rules and workflow triggers",
  },
  departmentOverview: {
    src: "/images/product/department-overview.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor department overview with task counts across the business",
  },
  analyticsReport: {
    src: "/images/product/analytics-report.png",
    width: 1600,
    height: 1000,
    alt: "Seamcor department analysis report with tasks, non-conformances and average times",
  },
} as const

export const TAGLINE = "Grown Up Technology"

export const COMPANY = {
  legalName: "Seamvex Data Systems Ltd",
  tradingName: "Seamcor",
  number: "17188046",
  jurisdiction: "England and Wales",
  registeredOffice: {
    lines: ["Church Court, Stourbridge Road", "Halesowen, England, B63 3TT"],
    singleLine: "Church Court, Stourbridge Road, Halesowen, England, B63 3TT",
  },
  websites: ["https://seamcor.com", "https://seamvex.com"],
  natureOfBusiness: "Software publishing",
} as const

export const CONTACT = {
  sales: "sales@seamcor.com",
  support: "support@seamcor.com",
  accounts: "accounts@seamcor.com",
  privacy: "accounts@seamcor.com",
  phone: "+44 7392 991808",
} as const

export const LEGAL = {
  privacy: "/legal/privacy",
  cookies: "/legal/cookies",
  terms: "/legal/terms",
  lastUpdated: "14 June 2026",
} as const

export const COOKIE_CONSENT_KEY = "seamcor-cookie-consent"
export const COOKIE_CONSENT_EVENT = "seamcor-cookie-consent-updated"

export const TRADEMARK_NOTICE =
  "Seamcor is the trading name of Seamvex Data Systems Ltd (company number 17188046). Seamvex Data Systems Ltd is the exclusive distributor of Seamcor software and holds the exclusive right to use the Seamcor trademark."

/** Mirrors customer-comms.md — continuity messaging for existing customers */
export const CUSTOMER_REASSURANCE = {
  headline: "Same software. Same people. Same contacts.",
  intro:
    "If you already use Seamcor, nothing changes in how you work day to day. The same platform, the same support team, and the same contact details you rely on.",
  points: [
    "Same Seamcor software — your platform and workflows stay as they are.",
    "Same people looking after you — support, account management and implementation continue as before.",
    "Same contact details — support@seamcor.com, accounts@seamcor.com, and +44 7392 991808.",
  ],
} as const

export const TESTIMONIALS = [
  {
    quote:
      "Our colleagues and compliance teams can access vital information at the click of a button, without wading through stacks of paper. It saves a lot of time.",
    name: "Lisa Widdison",
    role: "Director of Retail Operations, Holland & Barrett",
  },
  {
    quote:
      "The Seamcor software has made a tangible difference to our process. A low-cost innovation that lets us react in real time as challenges are identified.",
    name: "Ricardo Sousa",
    role: "Technical Manager, Gressingham",
  },
  {
    quote:
      "Seamcor is a great organisation, because the answer is never 'no'. They always say, 'Yes, we can make something happen'.",
    name: "Duncan MacMillan",
    role: "IT Director, Elis",
  },
  {
    quote:
      "Following the software integration, we have seen significantly reduced auditing times, as well as overall efficiency improvements. Our recent BRC Double A grade was largely achieved by the fact that we can now easily create and submit clear audit reports. Quite simply, Seamcor helped us grow. I could not see our business running without it now.",
    name: "David Elmer",
    role: "Operations Director, Puratos UK",
  },
] as const

export const SEAMCOR_JOURNEY = [
  {
    year: "2005",
    title: "Where it began",
    body: "Our journey started with a simple belief: organisations deserve software that fits how they really work — not the other way around.",
  },
  {
    year: "2007",
    title: "Principle Suite",
    body: "Principle Suite launched, bringing quality management, auditing and paperless data capture to teams who could not afford to cut corners.",
  },
  {
    year: "2020",
    title: "Listening and evolving",
    body: "Years of customer feedback shaped a full rebuild — same purpose, sharper workflows, and a platform ready for what businesses needed next.",
  },
  {
    year: "Oct 2023",
    title: "Seamcor",
    body: "Seamcor launched as the next chapter: the same trusted software philosophy, rebuilt as a modern, fully customisable Business Information & Workflow Management system.",
  },
  {
    year: "Today",
    title: "Seamvex",
    body: "Seamvex Data Systems Ltd now carries Seamcor forward — founded by Stephanie Meechan to run the business on honesty, fairness and doing things properly. Same software. Same commitment to customers. Just grown up.",
  },
] as const
