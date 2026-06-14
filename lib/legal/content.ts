import { COMPANY, CONTACT, LEGAL, TRADEMARK_NOTICE } from "@/lib/brand"

export type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
  list?: string[]
}

export type LegalDocument = {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}

const controllerBlock = `${COMPANY.legalName} (company number ${COMPANY.number}), registered in ${COMPANY.jurisdiction}, trading as ${COMPANY.tradingName}. Registered office: ${COMPANY.registeredOffice.singleLine}.`

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  description:
    "How Seamvex Data Systems Ltd, trading as Seamcor, collects and uses personal data when you visit our websites or contact us.",
  lastUpdated: LEGAL.lastUpdated,
  sections: [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        `This privacy policy explains how ${COMPANY.legalName}, trading as ${COMPANY.tradingName} ("we", "us", "our"), collects and uses personal data when you visit ${COMPANY.websites.join(" or ")} (the "Website") or contact us about our services.`,
        "We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.",
        "This policy applies to visitors to the Website and to individuals who contact us by email or telephone. It does not govern personal data processed within the Seamcor software platform for our customers; that processing is covered by separate customer agreements.",
      ],
    },
    {
      id: "controller",
      title: "2. Who we are (data controller)",
      paragraphs: [controllerBlock],
      list: [
        `Email: ${CONTACT.privacy}`,
        `Telephone: ${CONTACT.phone}`,
        `Sales enquiries: ${CONTACT.sales}`,
        `Support: ${CONTACT.support}`,
      ],
    },
    {
      id: "data-we-collect",
      title: "3. Personal data we collect",
      paragraphs: ["Depending on how you use the Website, we may collect:"],
      list: [
        "Identity and contact data you provide when you email or call us (for example your name, company name, email address and telephone number).",
        "Technical data such as IP address, browser type, device type, operating system and general location (country/region level).",
        "Usage data about how you browse the Website (for example pages viewed and time spent), but only if you accept analytics cookies.",
        "Your cookie consent preference.",
      ],
    },
    {
      id: "how-we-collect",
      title: "4. How we collect personal data",
      paragraphs: ["We collect personal data:"],
      list: [
        "Directly from you when you contact us.",
        "Automatically through server logs when you visit the Website.",
        "Through analytics technologies if you accept non-essential cookies (see our Cookie Policy).",
      ],
    },
    {
      id: "purposes",
      title: "5. How we use your data and lawful bases",
      paragraphs: ["We use personal data for the following purposes:"],
      list: [
        "To respond to enquiries and provide information about our services — lawful basis: legitimate interests (running and growing our business) and, where relevant, steps at your request prior to entering a contract.",
        "To operate, maintain and secure the Website — lawful basis: legitimate interests.",
        "To comply with legal and regulatory obligations — lawful basis: legal obligation.",
        "To analyse Website use and improve content and performance — lawful basis: your consent (analytics cookies only).",
      ],
    },
    {
      id: "cookies",
      title: "6. Cookies",
      paragraphs: [
        `We use cookies and similar technologies on the Website. Essential cookies are required for the site to function. Analytics cookies are used only if you consent. For full details, see our Cookie Policy at ${LEGAL.cookies}.`,
      ],
    },
    {
      id: "sharing",
      title: "7. Who we share data with",
      paragraphs: [
        "We do not sell your personal data. We may share personal data with trusted service providers who process data on our behalf, including:",
      ],
      list: [
        "Vercel Inc. — website hosting and, if you consent, website analytics.",
        "Our email and IT service providers — to handle communications and operate our systems.",
        "Professional advisers — where required (for example lawyers or accountants).",
        "Regulators or law enforcement — where we are legally required to do so.",
      ],
    },
    {
      id: "transfers",
      title: "8. International transfers",
      paragraphs: [
        "Some of our service providers may process personal data outside the United Kingdom. Where this occurs, we ensure appropriate safeguards are in place, such as the UK International Data Transfer Agreement or equivalent approved mechanisms, unless an adequacy regulation applies.",
      ],
    },
    {
      id: "retention",
      title: "9. How long we keep data",
      paragraphs: [
        "We keep personal data only for as long as necessary for the purposes described in this policy, including to meet legal, accounting or reporting requirements.",
        "Enquiry records are typically kept for up to three years from the last contact unless a longer period is required. Analytics data is retained according to our analytics provider's settings (typically up to 24 months). Cookie consent records are kept for up to 12 months.",
      ],
    },
    {
      id: "rights",
      title: "10. Your rights",
      paragraphs: ["Under UK data protection law, you have the right to:"],
      list: [
        "Request access to your personal data.",
        "Request correction of inaccurate data.",
        "Request erasure of your data in certain circumstances.",
        "Object to processing based on legitimate interests.",
        "Request restriction of processing in certain circumstances.",
        "Request data portability where applicable.",
        "Withdraw consent at any time (for example by changing cookie preferences) without affecting the lawfulness of processing before withdrawal.",
      ],
    },
    {
      id: "complaints",
      title: "11. Complaints",
      paragraphs: [
        "If you have concerns about how we use your personal data, please contact us first using the details above.",
        "You also have the right to lodge a complaint with the Information Commissioner's Office (ICO): https://ico.org.uk/make-a-complaint/",
      ],
    },
    {
      id: "security",
      title: "12. Security",
      paragraphs: [
        "We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss or misuse. No method of transmission over the internet is completely secure; we cannot guarantee absolute security.",
      ],
    },
    {
      id: "changes",
      title: "13. Changes to this policy",
      paragraphs: [
        "We may update this privacy policy from time to time. The date at the top of this page shows when it was last revised. Please check this page periodically for updates.",
      ],
    },
  ],
}

export const cookiePolicy: LegalDocument = {
  title: "Cookie Policy",
  description:
    "Information about cookies and similar technologies used on the Seamcor and Seamvex websites.",
  lastUpdated: LEGAL.lastUpdated,
  sections: [
    {
      id: "what-are-cookies",
      title: "1. What are cookies?",
      paragraphs: [
        "Cookies are small text files placed on your device when you visit a website. They help the site work properly, remember preferences, or understand how visitors use the site.",
        "Similar technologies (such as local storage) may also be used; we refer to all of these as \"cookies\" in this policy.",
      ],
    },
    {
      id: "how-we-use",
      title: "2. How we use cookies",
      paragraphs: [
        `${COMPANY.legalName}, trading as ${COMPANY.tradingName}, uses cookies on ${COMPANY.websites.join(" and ")}.`,
        "We classify cookies as essential or non-essential. Non-essential cookies (analytics) are only placed after you give consent through our cookie banner.",
      ],
    },
    {
      id: "essential",
      title: "3. Essential cookies",
      paragraphs: ["These cookies are necessary for the Website to function and cannot be switched off."],
      list: [
        "seamcor-cookie-consent — stores your cookie preference (essential / analytics accepted). Duration: up to 12 months. Provider: Seamvex Data Systems Ltd.",
      ],
    },
    {
      id: "analytics",
      title: "4. Analytics cookies (non-essential)",
      paragraphs: [
        "These cookies help us understand how visitors use the Website so we can improve it. They are only set if you click \"Accept analytics cookies\" on our banner.",
      ],
      list: [
        "Vercel Analytics — collects anonymised usage data such as pages visited, referrer and device type. Duration: session / up to 24 months (provider dependent). Provider: Vercel Inc. Privacy information: https://vercel.com/legal/privacy-policy",
      ],
    },
    {
      id: "manage",
      title: "5. How to manage cookies",
      paragraphs: [
        "When you first visit the Website, you can accept analytics cookies, reject non-essential cookies, or read this policy before deciding.",
        "You can change your choice at any time by clearing cookies in your browser and revisiting the site, or by using the \"Cookie settings\" link in the website footer.",
        "You can also block cookies through your browser settings. Blocking all cookies may affect Website functionality.",
      ],
    },
    {
      id: "more-info",
      title: "6. More information",
      paragraphs: [
        `For how we use personal data collected via cookies, see our Privacy Policy at ${LEGAL.privacy}.`,
        `Questions: ${CONTACT.privacy}`,
      ],
    },
  ],
}

export const websiteTerms: LegalDocument = {
  title: "Website Terms of Use",
  description:
    "Terms governing your use of the Seamcor and Seamvex marketing websites operated by Seamvex Data Systems Ltd.",
  lastUpdated: LEGAL.lastUpdated,
  sections: [
    {
      id: "agreement",
      title: "1. Agreement to these terms",
      paragraphs: [
        `These Website Terms of Use ("Terms") apply to your access and use of ${COMPANY.websites.join(" and ")} (the "Website"), operated by ${COMPANY.legalName}, trading as ${COMPANY.tradingName} ("we", "us", "our").`,
        "By using the Website, you agree to these Terms. If you do not agree, please do not use the Website.",
        "These Terms relate to use of the Website only. If you purchase or use Seamcor software or services, separate customer terms and agreements apply.",
      ],
    },
    {
      id: "operator",
      title: "2. Website operator",
      paragraphs: [controllerBlock],
      list: [
        `Company number: ${COMPANY.number}`,
        `Registered in: ${COMPANY.jurisdiction}`,
        `Contact: ${CONTACT.sales}`,
      ],
    },
    {
      id: "permitted-use",
      title: "3. Permitted use",
      paragraphs: ["You may use the Website for lawful purposes only. You must not:"],
      list: [
        "Use the Website in any way that breaches applicable law or regulation.",
        "Attempt to gain unauthorised access to our systems or networks.",
        "Introduce viruses, malware or other harmful material.",
        "Scrape, harvest or systematically extract content without our prior written consent.",
        "Misrepresent your affiliation with us or use our branding without permission.",
      ],
    },
    {
      id: "information",
      title: "4. Website information",
      paragraphs: [
        "Content on the Website is provided for general information about our company and the Seamcor software platform. It is not professional, legal or technical advice.",
        "We aim to keep information accurate and up to date but do not warrant that content is complete, current or error-free. Product features and availability may change.",
        "Nothing on the Website constitutes a binding offer to supply software or services. Any contract requires a separate written agreement.",
      ],
    },
    {
      id: "ip",
      title: "5. Intellectual property",
      paragraphs: [
        `Website content — including text, graphics, page layout and marketing copy — is owned by or licensed to ${COMPANY.legalName} and protected by intellectual property laws.`,
        "You may view and print pages for your personal, non-commercial use. You must not copy, modify, distribute or exploit Website content without our prior written consent.",
        `${COMPANY.tradingName} is the trading name of ${COMPANY.legalName}. ${TRADEMARK_NOTICE} Unauthorised use of the Seamcor name or marks is prohibited.`,
      ],
    },
    {
      id: "third-party",
      title: "6. Third-party links",
      paragraphs: [
        "The Website may contain links to third-party websites. We are not responsible for the content, security or privacy practices of those sites. Access them at your own risk.",
      ],
    },
    {
      id: "privacy",
      title: "7. Privacy and cookies",
      paragraphs: [
        `Our Privacy Policy (${LEGAL.privacy}) and Cookie Policy (${LEGAL.cookies}) explain how we handle personal data and cookies. By using the Website, you acknowledge those policies.`,
      ],
    },
    {
      id: "liability",
      title: "8. Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, we exclude all implied warranties and conditions relating to the Website.",
        "We shall not be liable for any loss or damage arising from your use of, or inability to use, the Website, including indirect or consequential loss, loss of profit, data or business opportunity, except where such exclusion is prohibited by law.",
        "Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under English law.",
      ],
    },
    {
      id: "availability",
      title: "9. Availability",
      paragraphs: [
        "We do not guarantee that the Website will be available at all times or free from interruptions, errors or security vulnerabilities. We may suspend or withdraw the Website for maintenance or other operational reasons.",
      ],
    },
    {
      id: "changes",
      title: "10. Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. The \"last updated\" date at the top of this page indicates when they were last revised. Continued use of the Website after changes are posted constitutes acceptance of the updated Terms.",
      ],
    },
    {
      id: "law",
      title: "11. Governing law and jurisdiction",
      paragraphs: [
        "These Terms are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction, subject to any mandatory consumer protections that may apply to you.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [`If you have questions about these Terms, contact us at ${CONTACT.sales} or ${CONTACT.phone}.`],
    },
  ],
}
