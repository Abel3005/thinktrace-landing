"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff, Key } from "lucide-react"

interface ApiKeyCardProps {
  apiKey: string | null | undefined
}

export function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayKey = apiKey
    ? isVisible
      ? apiKey
      : `${apiKey.substring(0, 8)}${"•".repeat(apiKey.length - 8)}`
    : "키를 불러올 수 없습니다"

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg">API 키</CardTitle>
        <CardDescription>개발에 사용할 API 인증 키</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">인증 키</p>
            <div className="flex items-center gap-2">
              <code className="block flex-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-sm">{displayKey}</code>
              <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)} disabled={!apiKey}>
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!apiKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && <p className="text-xs text-primary">클립보드에 복사되었습니다</p>}
          </div>
        </div>
        <div className="rounded-lg bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">
            이 API 키를 사용하여 CodeTracker API에 인증하세요. 키를 안전하게 보관하고 공개 저장소에 커밋하지 마세요.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
