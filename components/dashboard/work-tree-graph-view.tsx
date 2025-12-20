"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FolderTree,
  Sparkles,
  Clock,
  MessageSquare,
  FileEdit,
  Loader2,
  X,
  AlertCircle,
  Construction,
  Bug,
  RefreshCw,
  FileText,
  Layers,
  ArrowLeft,
  ChevronRight,
  Users,
  User,
  Bot,
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AIInteraction, ConversationMessage } from '@/lib/api/types'
import { fetchInteractionMessages } from '@/lib/api/client'
import { DiffViewer, type FileChange } from './diff-viewer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Types
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

interface WorkTreeGraphViewProps {
  projectId: number;
  interactions: AIInteraction[];
  apiKey: string;
}

// Category styling
const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'feature':
      return { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', icon: Sparkles };
    case 'bugfix':
      return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: Bug };
    case 'refactor':
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: RefreshCw };
    case 'docs':
      return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: FileText };
    default:
      return { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400', icon: Layers };
  }
}

// Main Component
export function WorkTreeGraphView({ projectId, interactions, apiKey }: WorkTreeGraphViewProps) {
  const [workTree, setWorkTree] = useState<WorkTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WorkTreeNode | null>(null);

  // Fetch work tree data
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

  // Get child tasks for a group
  const getChildTasks = useCallback((groupId: string): WorkTreeNode[] => {
    if (!workTree) return [];
    return workTree.relationships
      .filter(rel => rel.from === groupId && rel.type === 'parent')
      .map(rel => workTree.nodes[rel.to])
      .filter(Boolean);
  }, [workTree]);

  // Get interactions for multiple tasks
  const getGroupInteractions = useCallback((tasks: WorkTreeNode[]): AIInteraction[] => {
    const allCommitHashes = tasks.flatMap(task => task.commit_hashes);
    return interactions.filter(interaction =>
      allCommitHashes.some(hash => interaction.commit_hash?.startsWith(hash))
    );
  }, [interactions]);

  // Get interaction count for a task
  const getTaskInteractionCount = useCallback((task: WorkTreeNode): number => {
    return interactions.filter(interaction =>
      task.commit_hashes.some(hash => interaction.commit_hash?.startsWith(hash))
    ).length;
  }, [interactions]);

  // Get interactions for a task
  const getTaskInteractions = useCallback((task: WorkTreeNode): AIInteraction[] => {
    return interactions.filter(interaction =>
      task.commit_hashes.some(hash => interaction.commit_hash?.startsWith(hash))
    );
  }, [interactions]);

  // Get groups
  const groups = useMemo(() => {
    if (!workTree) return [];
    return Object.values(workTree.nodes).filter(node => node.id.startsWith('group_'));
  }, [workTree]);

  // Get standalone tasks
  const standaloneTasks = useMemo(() => {
    if (!workTree) return [];
    return Object.values(workTree.nodes).filter(node => {
      if (node.id.startsWith('group_')) return false;
      const isChildOfGroup = workTree.relationships.some(
        rel => rel.to === node.id && rel.type === 'parent'
      );
      return !isChildOfGroup;
    });
  }, [workTree]);

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

  if (notFound || !workTree) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
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

  // If a group is selected, show the detail view
  if (selectedGroup) {
    const childTasks = getChildTasks(selectedGroup.id);
    const allTasks = [selectedGroup, ...childTasks];
    const groupInteractions = getGroupInteractions(allTasks);

    return (
      <GroupDetailView
        group={selectedGroup}
        childTasks={childTasks}
        interactions={groupInteractions}
        apiKey={apiKey}
        getTaskInteractionCount={getTaskInteractionCount}
        getTaskInteractions={getTaskInteractions}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  // Show group list
  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            작업 그룹 ({groups.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            작업 그룹을 클릭하여 상세 정보와 의존관계를 확인하세요
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups.map(group => {
              const childTasks = getChildTasks(group.id);
              const style = getCategoryStyle(group.category);
              const allTasks = [group, ...childTasks];
              const totalInteractions = getGroupInteractions(allTasks).length;

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`
                    cursor-pointer border-2 rounded-xl p-5 transition-all
                    hover:shadow-lg hover:scale-[1.01]
                    ${style.border} ${style.bg}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.border} border-2`}>
                      <style.icon className={`h-6 w-6 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{group.task_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                          {group.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {group.task_description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {childTasks.length}개 하위 작업
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          {totalInteractions}개 상호작용
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileEdit className="h-4 w-4" />
                          {group.commit_hashes.length}개 커밋
                        </span>
                      </div>

                      {/* Child task preview */}
                      {childTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <div className="flex flex-wrap gap-2">
                            {childTasks.slice(0, 4).map(task => {
                              const taskStyle = getCategoryStyle(task.category);
                              return (
                                <span
                                  key={task.id}
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${taskStyle.bg} ${taskStyle.border} border`}
                                >
                                  <taskStyle.icon className={`h-3 w-3 ${taskStyle.text}`} />
                                  <span className="truncate max-w-[120px]">{task.task_name}</span>
                                </span>
                              );
                            })}
                            {childTasks.length > 4 && (
                              <span className="text-xs text-muted-foreground px-2 py-1">
                                +{childTasks.length - 4}개 더
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </div>
              );
            })}

            {/* Standalone tasks */}
            {standaloneTasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  기타 작업 ({standaloneTasks.length})
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {standaloneTasks.map(task => {
                    const style = getCategoryStyle(task.category);
                    const interactionCount = getTaskInteractionCount(task);
                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-3 ${style.border} ${style.bg}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <style.icon className={`h-4 w-4 ${style.text}`} />
                          <span className="font-medium text-sm line-clamp-1">{task.task_name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                            {task.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {task.task_description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{interactionCount}개 상호작용</span>
                          <span>{task.commit_hashes.length}개 커밋</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {groups.length === 0 && standaloneTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>분석된 작업이 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Group Detail View
interface GroupDetailViewProps {
  group: WorkTreeNode;
  childTasks: WorkTreeNode[];
  interactions: AIInteraction[];
  apiKey: string;
  getTaskInteractionCount: (task: WorkTreeNode) => number;
  getTaskInteractions: (task: WorkTreeNode) => AIInteraction[];
  onBack: () => void;
}

function GroupDetailView({
  group,
  childTasks,
  interactions,
  apiKey,
  getTaskInteractionCount,
  getTaskInteractions,
  onBack
}: GroupDetailViewProps) {
  const [selectedTask, setSelectedTask] = useState<WorkTreeNode | null>(null);
  const style = getCategoryStyle(group.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`border-2 ${style.border} ${style.bg}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.border} border-2`}>
              <style.icon className={`h-6 w-6 ${style.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  작업 그룹
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                  {group.category}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{group.task_name}</h1>
              <p className="text-muted-foreground">{group.task_description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {childTasks.length}개 하위 작업
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {interactions.length}개 상호작용
                </span>
                <span className="flex items-center gap-1.5">
                  <FileEdit className="h-4 w-4" />
                  {group.commit_hashes.length}개 커밋
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderTree className="h-5 w-5" />
            하위 작업 ({childTasks.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            작업을 클릭하여 연관된 AI 상호작용을 확인하세요
          </p>
        </CardHeader>
        <CardContent>
          {childTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>하위 작업이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {childTasks.map(task => {
                const taskStyle = getCategoryStyle(task.category);
                const interactionCount = getTaskInteractionCount(task);
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`
                      cursor-pointer border-2 rounded-xl p-4 transition-all
                      hover:shadow-lg hover:scale-[1.01]
                      ${taskStyle.border} ${taskStyle.bg}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${taskStyle.bg} ${taskStyle.border} border`}>
                        <taskStyle.icon className={`h-5 w-5 ${taskStyle.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{task.task_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${taskStyle.bg} ${taskStyle.text} border ${taskStyle.border}`}>
                            {task.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {task.task_description}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {interactionCount}개 상호작용
                          </span>
                          <span className="flex items-center gap-1">
                            <FileEdit className="h-4 w-4" />
                            {task.commit_hashes.length}개 커밋
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Modal with AI Interactions */}
      {selectedTask && (
        <TaskInteractionModal
          task={selectedTask}
          interactions={getTaskInteractions(selectedTask)}
          apiKey={apiKey}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

// Task Interaction Modal - Shows AI interactions for a task with full conversation
interface TaskInteractionModalProps {
  task: WorkTreeNode;
  interactions: AIInteraction[];
  apiKey: string;
  onClose: () => void;
}

function TaskInteractionModal({ task, interactions, apiKey, onClose }: TaskInteractionModalProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<AIInteraction | null>(null);
  const style = getCategoryStyle(task.category);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-border rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${style.bg} border-b ${style.border} p-6 flex items-start justify-between shrink-0`}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.border} border`}>
              <style.icon className={`h-5 w-5 ${style.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{task.task_name}</h2>
                <span className={`text-xs px-2 py-1 rounded ${style.bg} ${style.text} border ${style.border}`}>
                  {task.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{task.task_description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI 상호작용 ({interactions.length})
          </h3>

          {interactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>연결된 AI 상호작용이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map(interaction => (
                <InteractionCard
                  key={interaction.id}
                  interaction={interaction}
                  isSelected={selectedInteraction?.id === interaction.id}
                  apiKey={apiKey}
                  onClick={() => setSelectedInteraction(
                    selectedInteraction?.id === interaction.id ? null : interaction
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Interaction Card with expandable conversation and diff
interface InteractionCardProps {
  interaction: AIInteraction;
  isSelected: boolean;
  apiKey: string;
  onClick: () => void;
}

function InteractionCard({ interaction, isSelected, apiKey, onClick }: InteractionCardProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[] | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);

  // Load messages and diff when expanded
  useEffect(() => {
    if (!isSelected) return;

    // Load messages
    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const data = await fetchInteractionMessages(interaction.id, apiKey);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    // Load diff
    const loadDiff = async () => {
      setDiffLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/interactions/${interaction.id}/diff`,
          {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setFileChanges(data.file_changes);
        }
      } catch (err) {
        console.error('Error fetching diff:', err);
      } finally {
        setDiffLoading(false);
      }
    };

    loadMessages();
    loadDiff();
  }, [isSelected, interaction.id, apiKey]);

  const timeAgo = formatDistanceToNow(new Date(interaction.started_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div
      className={`border rounded-lg transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border/50 bg-card/50 hover:border-primary/50'
      }`}
    >
      {/* Header - always visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm mb-2 line-clamp-2">
              {interaction.prompt_text || '(프롬프트 없음)'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
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
          <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded content */}
      {isSelected && (
        <div className="border-t border-border/50 p-4 space-y-6">
          {/* Conversation */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              대화 내용
            </h4>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">대화 내용 로딩 중...</span>
              </div>
            ) : messages.length === 0 ? (
              // Show prompt if no messages
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">사용자</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {interaction.prompt_text || '(프롬프트 없음)'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border/50 rounded-lg bg-accent/5 max-h-[300px] overflow-y-auto">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'user'
                          ? 'bg-blue-500/10'
                          : 'bg-primary/10'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.role === 'user' ? '사용자' : 'AI 어시스턴트'}
                        </p>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500/5 border border-blue-500/20'
                            : 'bg-primary/5 border border-primary/20'
                        }`}>
                          <div className="markdown-content text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content.replace(/\\n/g, '\n')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Changes */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              파일 변경사항
            </h4>
            {diffLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">변경사항 로딩 중...</span>
              </div>
            ) : (
              <DiffViewer fileChanges={fileChanges} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
