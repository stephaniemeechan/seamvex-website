import { buildLegalMetadata, LegalPage } from "@/components/legal-page"
import { cookiePolicy } from "@/lib/legal/content"

export const metadata = buildLegalMetadata(cookiePolicy)

export default function CookiePolicyPage() {
  return <LegalPage document={cookiePolicy} badge="Legal" />
}
