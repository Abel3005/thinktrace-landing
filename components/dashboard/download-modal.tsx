"use client"

import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Trash2,
  Monitor,
  Apple,
} from "lucide-react"
import { detectSimpleOS, type SimpleOS } from '@/lib/platform'
import { cn } from '@/lib/utils'

interface DownloadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | string
  projectName: string
  projectHash: string
  apiKey: string
  initialOS?: SimpleOS
}

const osInfo: Record<SimpleOS, {
  title: string
  description: string
  archNote: string
  warning?: string
}> = {
  'mac': {
    title: 'macOS',
    description: '아래 명령어를 프로젝트 루트 디렉토리에서 실행하세요.',
    archNote: '아키텍처(Intel/Apple Silicon)는 자동으로 감지됩니다.',
  },
  'linux': {
    title: 'Linux',
    description: '아래 명령어를 프로젝트 루트 디렉토리에서 실행하세요.',
    archNote: '아키텍처(x64/ARM64)는 자동으로 감지됩니다.',
  },
  'windows': {
    title: 'Windows',
    description: 'PowerShell에서 아래 명령어를 프로젝트 루트 디렉토리에서 실행하세요.',
    archNote: '',
    warning: 'Windows Defender가 파일을 차단할 수 있습니다. 차단될 경우 "추가 정보" → "실행"을 선택해주세요.',
  },
}

const osOptions: { os: SimpleOS; label: string; icon: React.ReactNode }[] = [
  { os: 'mac', label: 'Mac', icon: <Apple className="h-4 w-4" /> },
  { os: 'windows', label: 'Windows', icon: <Monitor className="h-4 w-4" /> },
  { os: 'linux', label: 'Linux', icon: <Terminal className="h-4 w-4" /> },
]

export function DownloadModal({
  open,
  onOpenChange,
  projectName,
  projectHash,
  apiKey,
  initialOS
}: DownloadModalProps) {
  const [copied, setCopied] = useState(false)
  const [uninstallCopied, setUninstallCopied] = useState(false)
  const [selectedOS, setSelectedOS] = useState<SimpleOS>(initialOS || 'mac')

  // 모달이 열릴 때 OS 감지
  useEffect(() => {
    if (open && !initialOS) {
      const detected = detectSimpleOS()
      if (detected) {
        setSelectedOS(detected)
      }
    }
  }, [open, initialOS])

  const info = osInfo[selectedOS]
  const isWindows = selectedOS === 'windows'

  // 기본 URL 생성
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  // 설치 명령어 생성
  const installCommand = useMemo(() => {
    const scriptUrl = `${baseUrl}/api/install-script?projectHash=${projectHash}&os=${selectedOS}`

    if (isWindows) {
      return `$headers = @{ "X-API-Key" = "${apiKey}" }; iwr -useb "${scriptUrl}" -Headers $headers | iex`
    } else {
      return `curl -fsSL -H "X-API-Key: ${apiKey}" "${scriptUrl}" | bash`
    }
  }, [baseUrl, projectHash, apiKey, selectedOS, isWindows])

  // 삭제 명령어 생성
  const uninstallCommand = useMemo(() => {
    if (isWindows) {
      return `Remove-Item -Recurse -Force .claude, .codetracker -ErrorAction SilentlyContinue`
    } else {
      return `rm -rf .claude .codetracker`
    }
  }, [isWindows])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy command')
    }
  }

  const handleUninstallCopy = async () => {
    try {
      await navigator.clipboard.writeText(uninstallCommand)
      setUninstallCopied(true)
      setTimeout(() => setUninstallCopied(false), 2000)
    } catch {
      console.error('Failed to copy uninstall command')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>CodeTracker 환경 설정</DialogTitle>
          <DialogDescription>
            {projectName} 프로젝트의 CodeTracker 설치 및 삭제
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* OS 선택 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">운영체제 선택</h4>
            <div className="grid grid-cols-3 gap-2">
              {osOptions.map((option) => (
                <Button
                  key={option.os}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOS(option.os)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10",
                    selectedOS === option.os && "border-primary bg-primary/10 text-primary"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* OS 정보 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{info.description}</p>
            {info.archNote && (
              <p className="text-xs text-primary/80">{info.archNote}</p>
            )}
          </div>

          {/* 설치 명령어 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              <span>{isWindows ? 'PowerShell 명령어' : '터미널 명령어'}</span>
            </div>

            <div className="relative group">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 border border-border p-4 font-mono text-sm overflow-x-auto">
                <code className="whitespace-pre-wrap break-all">{installCommand}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {copied && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                클립보드에 복사되었습니다!
              </p>
            )}
          </div>

          {/* 설치 후 안내 */}
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-sm font-medium">설치 후</h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.</li>
              <li>AI 작업 기록이 자동으로 수집됩니다.</li>
            </ul>
          </div>

          {/* 삭제 가이드 */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-medium">CodeTracker 삭제</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              CodeTracker를 완전히 삭제하려면 프로젝트 루트 디렉토리에서 아래 명령어를 실행하세요.
            </p>
            <div className="relative group">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 font-mono text-xs overflow-x-auto">
                <code className="whitespace-pre-wrap break-all text-destructive">{uninstallCommand}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 ml-2"
                  onClick={handleUninstallCopy}
                >
                  {uninstallCopied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            {uninstallCopied && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                클립보드에 복사되었습니다!
              </p>
            )}
          </div>

          {/* 경고 메시지 */}
          {info.warning && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
              <p className="text-xs text-yellow-500">{info.warning}</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                명령어 복사
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
