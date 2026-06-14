import { buildLegalMetadata, LegalPage } from "@/components/legal-page"
import { privacyPolicy } from "@/lib/legal/content"

export const metadata = buildLegalMetadata(privacyPolicy)

export default function PrivacyPolicyPage() {
  return <LegalPage document={privacyPolicy} badge="Legal" />
}
