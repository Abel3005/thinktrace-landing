"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Loader2, Shield, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import { ThinkTraceLogoMinimal } from "@/components/logo"

interface AdminHeaderProps {
  user: {
    username: string
    email: string
  } | null
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("로그아웃 오류:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-b border-purple-500/30 bg-purple-950/20 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ThinkTraceLogoMinimal size={28} />
            <h1 className="text-xl font-bold">ThinkTrace</h1>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-500/30">
            <Shield className="h-3 w-3" />
            관리자
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              내 대시보드
            </Link>
          </Button>
          <div className="hidden text-sm sm:block">
            <p className="font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="border-purple-500/30 hover:bg-purple-500/10"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  )
}
