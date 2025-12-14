"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Code2, Loader2, BookOpen } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  user: {
    username: string
    email: string
  } | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Code2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ThinkTrace</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/guide">
              <BookOpen className="mr-2 h-4 w-4" />
              설치 가이드
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
