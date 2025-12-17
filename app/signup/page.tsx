import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SignupForm } from "@/components/auth/signup-form"
import { ThinkTraceLogoMinimal } from "@/components/logo"
import Link from "next/link"

export default async function SignupPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ThinkTraceLogoMinimal size={28} />
          <span className="text-xl font-bold">ThinkTrace</span>
        </Link>
      </header>

      {/* 회원가입 폼 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <SignupForm />
      </div>
    </div>
  )
}
