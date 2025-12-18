"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function ServerErrorModal() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-yellow-500/10 p-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">서버 연결 오류</h2>
          <p className="mb-6 text-muted-foreground">
            서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              대시보드로 이동
            </Button>
            <Button onClick={() => router.refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
