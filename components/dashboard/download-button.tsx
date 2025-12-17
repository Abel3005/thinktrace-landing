"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Download, ChevronDown, Monitor, Check } from "lucide-react"
import { detectPlatform, getAllPlatforms, type Platform, type PlatformInfo } from '@/lib/platform'
import { DownloadModal } from './download-modal'

interface DownloadButtonProps {
  projectId: number | string
  projectName?: string
}

export function DownloadButton({ projectId, projectName }: DownloadButtonProps) {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformInfo | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const platform = detectPlatform()
    if (platform) {
      setDetectedPlatform(platform)
      setSelectedPlatform(platform.platform)
    }
  }, [])

  const handleDownload = () => {
    if (selectedPlatform) {
      setModalOpen(true)
    }
  }

  const allPlatforms = getAllPlatforms()
  const displayPlatform = selectedPlatform
    ? allPlatforms.find(p => p.platform === selectedPlatform)?.displayName
    : '플랫폼 선택'

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleDownload}
          disabled={!selectedPlatform}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          설정 파일 다운로드
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="truncate">{displayPlatform}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              플랫폼 선택
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allPlatforms.map(({ platform, displayName }) => (
              <DropdownMenuItem
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{displayName}</span>
                <div className="flex items-center gap-1">
                  {detectedPlatform?.platform === platform && (
                    <span className="text-xs text-muted-foreground">(감지됨)</span>
                  )}
                  {selectedPlatform === platform && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedPlatform && (
        <DownloadModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          projectId={projectId}
          projectName={projectName || String(projectId)}
          platform={selectedPlatform}
        />
      )}
    </>
  )
}
