"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Clock,
  MessageSquare,
  FileEdit,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Construction
} from "lucide-react"
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AIInteraction } from '@/lib/supabase/queries'
import { DiffViewer, type FileChange } from './diff-viewer'

interface WorkTreeNode {
  id: string;
  task_name: string;
  task_description: string;
  category: 'feature' | 'bugfix' | 'refactor' | 'docs';
  commit_hashes: string[];
  commit_messages: string[];
}

interface WorkTreeRelationship {
  from: string;
  to: string;
  type: 'dependency' | 'parent';
  reason: string;
}

interface WorkTreeData {
  nodes: Record<string, WorkTreeNode>;
  relationships: WorkTreeRelationship[];
}

interface WorkTreeViewProps {
  projectId: number;
  interactions: AIInteraction[];
  apiKey: string;
}

export function WorkTreeView({ projectId, interactions, apiKey }: WorkTreeViewProps) {
  const [workTree, setWorkTree] = useState<WorkTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkTree = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/work-tree`,
          {
            headers: {
              'X-API-Key': `${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch work tree');
        }
        const data = await response.json();
        setWorkTree(data.work_tree);
      } catch (err) {
        console.error('Error fetching work tree:', err);
        setError('작업 트리를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkTree();
  }, [projectId, apiKey]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupTasks = (groupId: string): WorkTreeNode[] => {
    if (!workTree) return [];
    return workTree.relationships
      .filter(rel => rel.from === groupId && rel.type === 'parent')
      .map(rel => workTree.nodes[rel.to])
      .filter(Boolean);
  };

  const getTaskInteractions = (taskNode: WorkTreeNode): AIInteraction[] => {
    return interactions.filter(interaction =>
      taskNode.commit_hashes.some(hash =>
        interaction.commit_hash?.startsWith(hash)
      )
    );
  };

  const groups = workTree
    ? Object.values(workTree.nodes).filter(node => node.id.startsWith('group_'))
    : [];

  const standaloneasks = workTree
    ? Object.values(workTree.nodes).filter(node => {
        if (node.id.startsWith('group_')) return false;
        const isChildOfGroup = workTree.relationships.some(
          rel => rel.to === node.id && rel.type === 'parent'
        );
        return !isChildOfGroup;
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">작업 트리를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="text-center py-12 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 404 또는 데이터 없음 - 준비중 플레이스홀더
  if (notFound || !workTree) {
    return (
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">준비중입니다</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              작업 그룹 기반의 보고서 기능을 준비하고 있습니다.<br />
              곧 AI가 분석한 작업 그룹별로 코드 변경사항을 확인하실 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 작업 그룹 */}
      {groups.map(group => (
        <WorkGroupCard
          key={group.id}
          group={group}
          tasks={getGroupTasks(group.id)}
          expanded={expandedGroups.has(group.id)}
          onToggle={() => toggleGroup(group.id)}
          selectedTask={selectedTask}
          onSelectTask={setSelectedTask}
          getTaskInteractions={getTaskInteractions}
          apiKey={apiKey}
        />
      ))}

      {/* 독립 작업 */}
      {standaloneasks.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              기타 작업
            </h3>
            <div className="space-y-2">
              {standaloneasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  interactions={getTaskInteractions(task)}
                  isSelected={selectedTask === task.id}
                  onSelect={() => setSelectedTask(task.id)}
                  apiKey={apiKey}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 작업 상세 모달 */}
      {selectedTask && workTree && (
        <TaskDetailModal
          task={workTree.nodes[selectedTask]}
          interactions={getTaskInteractions(workTree.nodes[selectedTask])}
          apiKey={apiKey}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

interface WorkGroupCardProps {
  group: WorkTreeNode;
  tasks: WorkTreeNode[];
  expanded: boolean;
  onToggle: () => void;
  selectedTask: string | null;
  onSelectTask: (taskId: string) => void;
  getTaskInteractions: (task: WorkTreeNode) => AIInteraction[];
  apiKey: string;
}

function WorkGroupCard({
  group,
  tasks,
  expanded,
  onToggle,
  selectedTask,
  onSelectTask,
  getTaskInteractions,
  apiKey,
}: WorkGroupCardProps) {
  const totalInteractions = tasks.reduce(
    (sum, task) => sum + getTaskInteractions(task).length,
    0
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'text-blue-500 bg-blue-500/10';
      case 'bugfix': return 'text-red-500 bg-red-500/10';
      case 'refactor': return 'text-yellow-500 bg-yellow-500/10';
      case 'docs': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-0">
        {/* 그룹 헤더 */}
        <div
          className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderTree className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{group.task_name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(group.category)}`}>
                    {group.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {group.task_description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{tasks.length}개 작업</span>
                  <span>•</span>
                  <span>{totalInteractions}개 AI 상호작용</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0">
              {expanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* 그룹 내 작업 목록 */}
        {expanded && tasks.length > 0 && (
          <div className="border-t border-border/50 p-4 bg-accent/5 space-y-2">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                interactions={getTaskInteractions(task)}
                isSelected={selectedTask === task.id}
                onSelect={() => onSelectTask(task.id)}
                apiKey={apiKey}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  task: WorkTreeNode;
  interactions: AIInteraction[];
  isSelected: boolean;
  onSelect: () => void;
  apiKey: string;
}

function TaskCard({ task, interactions, isSelected, onSelect }: TaskCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <Sparkles className="h-4 w-4" />;
      case 'bugfix': return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'text-blue-500 bg-blue-500/10';
      case 'bugfix': return 'text-red-500 bg-red-500/10';
      case 'refactor': return 'text-yellow-500 bg-yellow-500/10';
      case 'docs': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border/50 bg-card hover:border-primary/50 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getCategoryColor(task.category)}`}>
          {getCategoryIcon(task.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm line-clamp-1">
              {task.task_name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(task.category)}`}>
              {task.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.task_description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {interactions.length}개 상호작용
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {task.commit_hashes.length}개 커밋
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskDetailModalProps {
  task: WorkTreeNode;
  interactions: AIInteraction[];
  apiKey: string;
  onClose: () => void;
}

interface DiffResponse {
  commit: {
    commit_hash: string;
    committed_at: string;
    message: string;
    short_hash: string;
  };
  file_changes: FileChange[] | null;
}

function TaskDetailModal({ task, interactions, apiKey, onClose }: TaskDetailModalProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<AIInteraction | null>(null);
  const [fileChanges, setFileChanges] = useState<FileChange[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiff = async (interaction: AIInteraction) => {
    setSelectedInteraction(interaction);
    setLoading(true);
    setError(null);
    setFileChanges(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interactions/${interaction.id}/diff`,
        {
          headers: {
            'X-API-Key': `${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch diff');
      }
      const data: DiffResponse = await response.json();
      setFileChanges(data.file_changes);
    } catch (err) {
      console.error('Error fetching diff:', err);
      setError('변경사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'text-blue-500 bg-blue-500/10';
      case 'bugfix': return 'text-red-500 bg-red-500/10';
      case 'refactor': return 'text-yellow-500 bg-yellow-500/10';
      case 'docs': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-card border-b border-border p-6 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FolderTree className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{task.task_name}</h2>
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(task.category)}`}>
                  {task.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{task.task_description}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{interactions.length}개 AI 상호작용</span>
                <span>•</span>
                <span>{task.commit_hashes.length}개 커밋</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Interactions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI 상호작용
            </h3>
            {interactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>이 작업에 연결된 AI 상호작용이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {interactions.map(interaction => (
                  <div
                    key={interaction.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedInteraction?.id === interaction.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 bg-card/50 hover:border-primary/50'
                    }`}
                    onClick={() => loadDiff(interaction)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1 line-clamp-2">
                          {interaction.prompt_text}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(interaction.started_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                          {interaction.duration_seconds && (
                            <>
                              <span>•</span>
                              <span>{interaction.duration_seconds}초</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileEdit className="h-3 w-3" />
                            {interaction.files_modified}개 파일
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 Interaction의 Diff */}
          {selectedInteraction && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                파일 변경사항
              </h3>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-1">프롬프트</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedInteraction.prompt_text}
                </p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">변경사항을 불러오는 중...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <DiffViewer fileChanges={fileChanges} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
