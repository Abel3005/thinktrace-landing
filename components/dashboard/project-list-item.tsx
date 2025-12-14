"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderGit2, GitCommit, Sparkles, FileEdit, TrendingUp, TrendingDown, Download, Loader2 } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { detectPlatform, type Platform } from '@/lib/platform'

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
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const detected = detectPlatform();
    if (detected) {
      setPlatform(detected.platform);
    }
  }, []);

  const lastUpdated = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: ko
  });

  const netChanges = project.total_insertions - project.total_deletions;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!platform) {
      alert('플랫폼을 감지할 수 없습니다. 프로젝트 상세 페이지에서 직접 선택해주세요.');
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(`/api/download-codetracker?projectId=${project.repo_id}&platform=${platform}`);

      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다');
      }

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        || `codetracker_${project.repo_name.replace(/[^a-zA-Z0-9]/g, '_')}_${platform}.zip`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Link href={`/dashboard/projects/${project.repo_id}`} className="block">
      <Card className="border-border/50 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
        <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderGit2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{project.repo_name}</h3>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="shrink-0"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">다운로드 중...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">CodeTracker</span>
                </>
              )}
            </Button>
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
    </Link>
  );
}
