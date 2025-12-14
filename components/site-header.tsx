import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, LayoutDashboard } from "lucide-react"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function SiteHeader() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Code2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ThinkTrace</h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/guide">설치 가이드</Link>
          </Button>
          {isLoggedIn ? (
            <Button asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                대시보드
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">시작하기</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
