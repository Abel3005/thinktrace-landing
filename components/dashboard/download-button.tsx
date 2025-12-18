"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DownloadModal } from './download-modal'

interface DownloadButtonProps {
  projectId: number | string
  projectName?: string
  projectHash: string
  apiKey: string
}

export function DownloadButton({ projectId, projectName, projectHash, apiKey }: DownloadButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        환경 설정
      </Button>

      <DownloadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        projectName={projectName || String(projectId)}
        projectHash={projectHash}
        apiKey={apiKey}
      />
    </>
  )
}
