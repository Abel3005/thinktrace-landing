"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Clock, MessageSquare, FileEdit, Loader2, X, File as FileIcon, GitBranch, Play, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useState, useEffect, useCallback } from 'react'
import type { ProjectInfo, AIInteraction } from '@/lib/supabase/queries'
import { InteractionListView } from './interaction-list-view'

interface WorkTreeHistoryItem {
  id: number;
  repo_id: number;
  work_tree: any;
  created_at: string;
}

interface AdminProjectDetailContentProps {
  project: ProjectInfo;
  interactions: AIInteraction[];
  apiKey: string;
  userId: string;
}

export function AdminProjectDetailContent({ project, interactions, apiKey, userId }: AdminProjectDetailContentProps) {
  const [showRecentFilesModal, setShowRecentFilesModal] = useState(false);
  const [workTreeHistory, setWorkTreeHistory] = useState<WorkTreeHistoryItem[]>([]);
  const [workTreeLoading, setWorkTreeLoading] = useState(false);
  const [workTreeGenerating, setWorkTreeGenerating] = useState(false);
  const [workTreeError, setWorkTreeError] = useState<string | null>(null);
  const [selectedWorkTree, setSelectedWorkTree] = useState<WorkTreeHistoryItem | null>(null);

  // Work-tree 히스토리 불러오기
  const fetchWorkTreeHistory = useCallback(async () => {
    setWorkTreeLoading(true);
    setWorkTreeError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/work-tree/history`,
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch work-tree history');
      }
      const data = await response.json();
      setWorkTreeHistory(data);
    } catch (err) {
      console.error('Error fetching work-tree history:', err);
      setWorkTreeError('Work-tree 기록을 불러오는데 실패했습니다.');
    } finally {
      setWorkTreeLoading(false);
    }
  }, [project.id, apiKey]);

  // Work-tree 생성
  const generateWorkTree = async () => {
    setWorkTreeGenerating(true);
    setWorkTreeError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/work-tree`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to generate work-tree');
      }
      // 생성 후 히스토리 새로고침
      await fetchWorkTreeHistory();
    } catch (err) {
      console.error('Error generating work-tree:', err);
      setWorkTreeError('Work-tree 생성에 실패했습니다.');
    } finally {
      setWorkTreeGenerating(false);
    }
  };

  // 컴포넌트 마운트 시 히스토리 로드
  useEffect(() => {
    fetchWorkTreeHistory();
  }, [fetchWorkTreeHistory]);

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.repo_name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
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

      {/* Work-tree 생성 및 히스토리 */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Work-tree 분석
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI가 분석한 프로젝트 작업 트리를 생성하고 기록을 확인할 수 있습니다.
              </p>
            </div>
            <Button
              onClick={generateWorkTree}
              disabled={workTreeGenerating}
              className="shrink-0"
            >
              {workTreeGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Work-tree 생성
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workTreeError && (
            <div className="text-red-500 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
              {workTreeError}
            </div>
          )}

          {workTreeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">히스토리 로딩 중...</span>
            </div>
          ) : workTreeHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>생성된 Work-tree가 없습니다.</p>
              <p className="text-sm mt-1">위 버튼을 클릭하여 Work-tree를 생성해보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workTreeHistory.map((item) => (
                <div
                  key={item.id}
                  className="border border-border/50 rounded-lg p-4 bg-card/50 hover:bg-card transition-colors cursor-pointer"
                  onClick={() => setSelectedWorkTree(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Work-tree #{item.id}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      상세 보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 작업 그룹 기반 보고서 */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            작업 트리
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI가 추론한 작업 그룹별로 상호작용 기록을 확인할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent>
          <InteractionListView
            interactions={interactions}
            apiKey={apiKey}
          />
        </CardContent>
      </Card>

      {/* Work-tree 상세 모달 */}
      {selectedWorkTree && (
        <WorkTreeDetailModal
          workTree={selectedWorkTree}
          onClose={() => setSelectedWorkTree(null)}
        />
      )}

      {/* 최근 변경된 파일 모달 */}
      {showRecentFilesModal && (
        <RecentFilesModal
          projectId={project.id}
          apiKey={apiKey}
          onClose={() => setShowRecentFilesModal(false)}
        />
      )}
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

interface WorkTreeDetailModalProps {
  workTree: WorkTreeHistoryItem;
  onClose: () => void;
}

function WorkTreeDetailModal({ workTree, onClose }: WorkTreeDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-border rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-card border-b border-border p-6 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1">Work-tree #{workTree.id}</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(workTree.created_at), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">
              {typeof workTree.work_tree === 'string'
                ? workTree.work_tree
                : JSON.stringify(workTree.work_tree, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
