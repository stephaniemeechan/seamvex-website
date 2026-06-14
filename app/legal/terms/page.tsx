import { buildLegalMetadata, LegalPage } from "@/components/legal-page"
import { websiteTerms } from "@/lib/legal/content"

export const metadata = buildLegalMetadata(websiteTerms)

export default function WebsiteTermsPage() {
  return <LegalPage document={websiteTerms} badge="Legal" />
}
