import { SiteHeader } from "@/components/site-header"
import { GuideContent } from "@/components/guide/guide-content"

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <GuideContent />
    </div>
  )
}
