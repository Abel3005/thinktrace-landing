"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Circle,
  Loader2,
  Copy,
  Check,
  FileArchive,
  Download,
  Terminal,
  AlertTriangle
} from "lucide-react"
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/platform'

type DownloadStep = 'idle' | 'generating' | 'downloading' | 'completed' | 'error'

interface DownloadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | string
  projectName: string
  platform: Platform
}

const platformInstructions: Record<Platform, {
  title: string
  steps: string[]
  commands?: string[]
  warning?: string
}> = {
  'darwin-arm64': {
    title: 'macOS (Apple Silicon) 설치 안내',
    steps: [
      '다운로드된 zip 파일을 프로젝트 루트 폴더에 압축 해제하세요.',
      '터미널에서 아래 명령어를 실행하여 실행 권한을 부여하세요.',
      'Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.',
    ],
    commands: [
      'chmod +x .claude/hooks/user_prompt_submit',
      'chmod +x .claude/hooks/stop',
    ],
  },
  'darwin-amd64': {
    title: 'macOS (Intel) 설치 안내',
    steps: [
      '다운로드된 zip 파일을 프로젝트 루트 폴더에 압축 해제하세요.',
      '터미널에서 아래 명령어를 실행하여 실행 권한을 부여하세요.',
      'Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.',
    ],
    commands: [
      'chmod +x .claude/hooks/user_prompt_submit',
      'chmod +x .claude/hooks/stop',
    ],
  },
  'linux-amd64': {
    title: 'Linux (x64) 설치 안내',
    steps: [
      '다운로드된 zip 파일을 프로젝트 루트 폴더에 압축 해제하세요.',
      '터미널에서 아래 명령어를 실행하여 실행 권한을 부여하세요.',
      'Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.',
    ],
    commands: [
      'chmod +x .claude/hooks/user_prompt_submit',
      'chmod +x .claude/hooks/stop',
    ],
  },
  'linux-arm64': {
    title: 'Linux (ARM64) 설치 안내',
    steps: [
      '다운로드된 zip 파일을 프로젝트 루트 폴더에 압축 해제하세요.',
      '터미널에서 아래 명령어를 실행하여 실행 권한을 부여하세요.',
      'Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.',
    ],
    commands: [
      'chmod +x .claude/hooks/user_prompt_submit',
      'chmod +x .claude/hooks/stop',
    ],
  },
  'windows-amd64': {
    title: 'Windows (x64) 설치 안내',
    steps: [
      '다운로드된 zip 파일을 프로젝트 루트 폴더에 압축 해제하세요.',
      'Windows에서는 추가 권한 설정이 필요하지 않습니다.',
      'Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.',
    ],
    warning: 'Windows Defender가 파일을 차단할 수 있습니다. 차단될 경우 "추가 정보" → "실행"을 선택해주세요.',
  },
}

export function DownloadModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  platform
}: DownloadModalProps) {
  const [step, setStep] = useState<DownloadStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const instructions = platformInstructions[platform]

  const handleCopyCommand = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      console.error('Failed to copy command')
    }
  }

  const startDownload = useCallback(async () => {
    setStep('generating')
    setError(null)

    try {
      // Step 1: 파일 생성 요청
      const url = `/api/download-codetracker?projectId=${projectId}&platform=${platform}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '다운로드 실패')
      }

      // Step 2: 다운로드
      setStep('downloading')

      const blob = await response.blob()
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || `codetracker_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${platform}.zip`

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // 완료
      setStep('completed')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setStep('error')
    }
  }, [projectId, projectName, platform])

  // 모달이 열리면 자동으로 다운로드 시작
  useEffect(() => {
    if (open && step === 'idle') {
      startDownload()
    }
  }, [open, step, startDownload])

  // 모달이 닫히면 상태 초기화
  useEffect(() => {
    if (!open) {
      // 약간의 딜레이 후 초기화 (애니메이션 완료 후)
      const timer = setTimeout(() => {
        setStep('idle')
        setError(null)
        setCopiedIndex(null)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  const renderStepIcon = (currentStep: DownloadStep, targetStep: DownloadStep) => {
    const stepOrder: DownloadStep[] = ['generating', 'downloading', 'completed']
    const currentIndex = stepOrder.indexOf(currentStep)
    const targetIndex = stepOrder.indexOf(targetStep)

    if (currentStep === 'error') {
      return <AlertTriangle className="h-5 w-5 text-destructive" />
    }

    if (currentIndex > targetIndex) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }

    if (currentIndex === targetIndex) {
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />
    }

    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CodeTracker 다운로드</DialogTitle>
          <DialogDescription>
            {projectName} 프로젝트용 설정 파일
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 진행 단계 */}
          <div className="space-y-4">
            {/* Step 1: 파일 생성 */}
            <div className="flex items-center gap-3">
              {renderStepIcon(step, 'generating')}
              <div className="flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "text-sm",
                  step === 'generating' ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  설정 파일 생성 중...
                </span>
              </div>
            </div>

            {/* Step 2: 다운로드 */}
            <div className="flex items-center gap-3">
              {renderStepIcon(step, 'downloading')}
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "text-sm",
                  step === 'downloading' ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  파일 다운로드 중...
                </span>
              </div>
            </div>

            {/* 에러 메시지 */}
            {step === 'error' && error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startDownload}
                  className="mt-2"
                >
                  다시 시도
                </Button>
              </div>
            )}
          </div>

          {/* 설치 안내 (항상 표시) */}
          <div className="space-y-4 border-t border-border pt-4">
            {step === 'completed' && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">다운로드 완료!</span>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium">{instructions.title}</h4>

              <ol className="space-y-2 text-sm text-muted-foreground">
                {instructions.steps.map((stepText, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary font-medium">{index + 1}.</span>
                    <span>{stepText}</span>
                  </li>
                ))}
              </ol>

              {/* 명령어 복사 영역 */}
              {instructions.commands && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Terminal className="h-3 w-3" />
                    <span>터미널 명령어</span>
                  </div>
                  {instructions.commands.map((command, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs"
                    >
                      <code className="truncate">{command}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopyCommand(command, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* 경고 메시지 */}
              {instructions.warning && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
                  <p className="text-xs text-yellow-500">{instructions.warning}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end pt-2">
          <Button
            variant={step === 'completed' ? 'default' : 'outline'}
            onClick={() => onOpenChange(false)}
          >
            {step === 'completed' ? '완료' : '닫기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
