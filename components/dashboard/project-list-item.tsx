"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderGit2, GitCommit, Sparkles, FileEdit, TrendingUp, TrendingDown, Settings, Trash2, Loader2, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadModal } from './download-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ProjectStatistics {
  repo_id: number;
  repo_name: string;
  repo_hash: string;
  description: string | null;
  commit_count: number;
  interaction_count: number;
  files_changed: number;
  total_insertions: number;
  total_deletions: number;
  created_at: string;
  updated_at: string;
}

interface ProjectListItemProps {
  project: ProjectStatistics;
  apiKey: string;
  onDelete?: (projectId: number) => void;
}

export function ProjectListItem({ project, apiKey, onDelete }: ProjectListItemProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    router.push(`/dashboard/projects/${project.repo_id}`);
  };

  const lastUpdated = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: ko
  });

  const netChanges = project.total_insertions - project.total_deletions;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: project.repo_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setDeleteDialogOpen(false);
      onDelete?.(project.repo_id);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="border-border/50 bg-card/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderGit2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">{project.repo_name}</h3>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  {project.interaction_count > 1 ? (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                      테스트 완료
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      테스트 전
                    </span>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  마지막 업데이트: {lastUpdated}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">환경 설정</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
                className="text-red-500 hover:text-red-600 hover:border-red-500/50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 커밋 수 */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <GitCommit className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">커밋</p>
                <p className="text-lg font-semibold">{project.commit_count}</p>
              </div>
            </div>

            {/* AI 인터랙션 */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI 인터랙션</p>
                <p className="text-lg font-semibold">{project.interaction_count}</p>
              </div>
            </div>

            {/* 파일 변경 */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <FileEdit className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">파일 변경</p>
                <p className="text-lg font-semibold">{project.files_changed}</p>
              </div>
            </div>

            {/* 코드 변경량 */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                netChanges >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                {netChanges >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">코드 변경</p>
                <p className="text-lg font-semibold">
                  {netChanges >= 0 ? '+' : ''}{netChanges.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 상세 통계 */}
          <div className="flex gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <span className="text-green-500">+{project.total_insertions.toLocaleString()} 추가</span>
            <span className="text-red-500">-{project.total_deletions.toLocaleString()} 삭제</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <DownloadModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      projectId={project.repo_id}
      projectName={project.repo_name}
      projectHash={project.repo_hash}
      apiKey={apiKey}
    />

    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로젝트 삭제</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{project.repo_name}</span> 프로젝트를 삭제하시겠습니까?
            <br />
            <span className="text-red-500">이 작업은 되돌릴 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
