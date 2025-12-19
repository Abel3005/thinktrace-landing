"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Sparkles, Clock, FileEdit, Loader2, X, File as FileIcon, Trash2, FileBarChart, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { ProjectInfo, AIInteraction } from '@/lib/supabase/queries'
import { DownloadButton } from './download-button'
import { TopTasksReport } from './top-tasks-report'
import { InteractionListView } from './interaction-list-view'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProjectDetailContentProps {
  project: ProjectInfo;
  interactions: AIInteraction[];
  apiKey: string;
}

export function ProjectDetailContent({ project, interactions, apiKey }: ProjectDetailContentProps) {
  const router = useRouter();
  const [showRecentFilesModal, setShowRecentFilesModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 전체 통계 계산
  const stats = {
    totalInteractions: interactions.length,
    totalFilesModified: interactions.reduce((sum, i) => sum + i.files_modified, 0),
    avgDuration: interactions.length > 0
      ? Math.round(
          interactions
            .filter(i => i.duration_seconds)
            .reduce((sum, i) => sum + (i.duration_seconds || 0), 0) / interactions.length
        )
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.repo_name}</h1>
            {stats.totalInteractions > 1 && (
              <span className="shrink-0 text-sm px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                테스트 완료
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <DownloadButton
          projectId={project.id}
          projectName={project.repo_name}
          projectHash={project.repo_hash}
          apiKey={apiKey}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          className="text-red-500 hover:text-red-600 hover:border-red-500/50"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI 작업</p>
                <p className="text-2xl font-bold">{stats.totalInteractions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-border/50 bg-card/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
          onClick={() => setShowRecentFilesModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileEdit className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">수정된 파일</p>
                <p className="text-2xl font-bold">{stats.totalFilesModified}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Clock className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 소요시간</p>
                <p className="text-2xl font-bold">{stats.avgDuration}초</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="report" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            주요 작업 분석
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI 상호작용
          </TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="mt-6">
          <TopTasksReport
            projectId={project.id}
            apiKey={apiKey}
          />
        </TabsContent>
        <TabsContent value="interactions" className="mt-6">
          <InteractionListView
            interactions={interactions}
            apiKey={apiKey}
          />
        </TabsContent>
      </Tabs>

      {/* 최근 변경된 파일 모달 */}
      {showRecentFilesModal && (
        <RecentFilesModal
          projectId={project.id}
          apiKey={apiKey}
          onClose={() => setShowRecentFilesModal(false)}
        />
      )}

      {/* 프로젝트 삭제 확인 다이얼로그 */}
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
    </div>
  );
}

interface RecentFilesModalProps {
  projectId: number;
  apiKey: string;
  onClose: () => void;
}

interface RecentFileItem {
  file_path: string;
  last_modified: string;
  change_count: number;
  last_change_type: string;
}

function RecentFilesModal({ projectId, apiKey, onClose }: RecentFilesModalProps) {
  const [files, setFiles] = useState<RecentFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/recent-files?limit=10`,
          {
            headers: {
              'X-API-Key': `${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch recent files');
        }
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        console.error('Error fetching recent files:', err);
        setError('최근 파일을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentFiles();
  }, [projectId, apiKey]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-border rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-card border-b border-border p-6 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <FileEdit className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1">최근 변경된 파일</h2>
              <p className="text-sm text-muted-foreground">최근 수정된 파일 목록입니다</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">파일 목록을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>변경된 파일이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="border border-border/50 rounded-lg p-4 bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-mono text-sm font-medium truncate">
                          {file.file_path}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(file.last_modified), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                        <span>•</span>
                        <span>{file.change_count}회 수정</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          file.last_change_type === 'A'
                            ? 'bg-green-500/10 text-green-500'
                            : file.last_change_type === 'D'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {file.last_change_type === 'A'
                          ? '추가'
                          : file.last_change_type === 'D'
                          ? '삭제'
                          : '수정'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
