"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  Clock,
  User,
  Bot,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  HelpCircle,
  Loader2,
  FileBarChart,
  ArrowRight,
  MessageSquare,
  Construction,
  Target,
  Flag,
  Workflow,
  GitCommit,
  Code,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  BookOpen
} from "lucide-react"

interface TopTask {
  task_id: string;
  task_name: string;
  task_description?: string;
  category: string;
  persona: {
    bloom: string;
    persona: string;
    core_skill: string;
  };
  effort_score: number;
  commit_count: number;
  interaction_count?: number;
  total_lines_changed?: number;
  gap_analysis: {
    intent: string;
    status: 'FAIL' | 'PARTIAL' | 'MANUAL' | 'NO_DATA' | 'SUCCESS' | 'CONTEXT';
    outcome: string;
    gap_reason: string | null;
    success_rate: number | null;
    type_breakdown?: {
      change_count: number;
      context_count: number;
      status_counts: {
        FAIL: number;
        CONTEXT: number;
        PARTIAL: number;
        SUCCESS: number;
        UNKNOWN: number;
      };
    };
  };
  thought_process: {
    commit_flow: Array<{
      hash: string;
      step: number;
      message: string;
    }>;
    user_intent: string;
    final_outcome: string;
    execution_flow: string;
    commit_relations: Array<{
      from_step: number;
      to_step: number;
      relation: string;
    }>;
    improvement_feedback?: {
      suggestions: string[];
      flow_assessment: string;
      is_flow_appropriate: boolean;
    };
  };
  interaction_analyses: Array<{
    interaction_id: number;
    prompt_summary: string;
    intent: string;
    status: string;
    outcome: string;
    gap_reason: string | null;
    interaction_type?: 'change' | 'context';
  }>;
  total_duration_minutes: number;
}

interface TopTasksReportProps {
  projectId: number;
  apiKey: string;
}

export function TopTasksReport({ projectId, apiKey }: TopTasksReportProps) {
  const [topTasks, setTopTasks] = useState<TopTask[]>([]);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTopTasks = async () => {
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
        console.log('Work tree API response:', data);

        // top_tasks_analysis 또는 top_tasks 필드에서 데이터 가져오기
        let topTasksData = data.top_tasks_analysis || data.top_tasks;

        // 배열이 아닌 경우 처리
        if (topTasksData && !Array.isArray(topTasksData)) {
          if (typeof topTasksData === 'object') {
            topTasksData = Object.values(topTasksData);
          }
        }

        if (Array.isArray(topTasksData) && topTasksData.length > 0) {
          setTopTasks(topTasksData);
        }
        if (data.analyzed_at) {
          setAnalyzedAt(data.analyzed_at);
        }
      } catch (err) {
        console.error('Error fetching top tasks:', err);
        setError('분석 보고서를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTasks();
  }, [projectId, apiKey]);

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">분석 보고서를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="text-center py-12 text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notFound || topTasks.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            주요 작업 분석 보고서
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            공수가 가장 많이 투입된 상위 작업들의 효율성 분석입니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">분석 준비중</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              충분한 작업 데이터가 수집되면 AI가 자동으로 분석 보고서를 생성합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              주요 작업 분석 보고서
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              공수가 가장 많이 투입된 상위 {topTasks.length}개 작업의 효율성 분석
            </p>
          </div>
          {analyzedAt && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {new Date(analyzedAt).toLocaleString('ko-KR')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {topTasks.map((task, index) => (
          <TaskReportCard
            key={task.task_id}
            task={task}
            rank={index + 1}
            expanded={expandedTasks.has(task.task_id)}
            onToggle={() => toggleTask(task.task_id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface TaskReportCardProps {
  task: TopTask;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}

function TaskReportCard({ task, rank, expanded, onToggle }: TaskReportCardProps) {
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'feature': return 'bg-blue-500/10 text-blue-500';
      case 'bugfix': return 'bg-red-500/10 text-red-500';
      case 'refactor': return 'bg-amber-500/10 text-amber-500';
      case 'docs': return 'bg-emerald-500/10 text-emerald-500';
      case 'test': return 'bg-purple-500/10 text-purple-500';
      case 'config': return 'bg-cyan-500/10 text-cyan-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PARTIAL': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'FAIL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 className="h-4 w-4" />;
      case 'PARTIAL': return <MinusCircle className="h-4 w-4" />;
      case 'FAIL': return <AlertCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '성공';
      case 'PARTIAL': return '부분 성공';
      case 'FAIL': return '실패';
      case 'MANUAL': return '수동 처리';
      case 'NO_DATA': return '데이터 없음';
      default: return status;
    }
  };

  // 실행 흐름을 화살표로 구분된 단계로 파싱
  const executionSteps = task.thought_process.execution_flow
    ? task.thought_process.execution_flow.split('→').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
      {/* 카드 헤더 */}
      <div
        className="p-5 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* 순위 */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {rank}
            </div>

            <div className="flex-1 min-w-0">
              {/* 작업명 + 배지들 */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="font-bold text-lg">{task.task_name}</h4>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryStyle(task.category)}`}>
                  {task.category}
                </span>
                {task.persona && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {task.persona.bloom} · {task.persona.persona}
                  </span>
                )}
              </div>

              {/* 작업 설명 */}
              {task.task_description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{task.task_description}</p>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>공수 <strong className="text-foreground">{task.effort_score.toFixed(1)}</strong></span>
                </div>
                {task.total_duration_minutes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span><strong className="text-foreground">{task.total_duration_minutes.toFixed(1)}</strong>분</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <span>{task.commit_count}개 커밋</span>
                </div>
                {task.total_lines_changed && task.total_lines_changed > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span>{task.total_lines_changed.toLocaleString()}줄 변경</span>
                  </div>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getStatusStyle(task.gap_analysis.status)}`}>
                  {getStatusIcon(task.gap_analysis.status)}
                  {getStatusLabel(task.gap_analysis.status)}
                  {task.gap_analysis.success_rate !== null && ` (${task.gap_analysis.success_rate}%)`}
                </span>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* 확장된 콘텐츠 - 작업 요약 메인 */}
      {expanded && (
        <div className="border-t border-border/50">
          {/* 작업 요약 섹션 - 메인 */}
          <div className="p-6 bg-accent/5">
            <h5 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              작업 요약
            </h5>

            {/* 사용자 의도 & 최종 결과 */}
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div className="p-4 rounded-lg bg-card border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">사용자 의도</span>
                </div>
                <p className="text-sm leading-relaxed">
                  {task.thought_process.user_intent}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">최종 결과</span>
                </div>
                <p className="text-sm leading-relaxed">
                  {task.thought_process.final_outcome}
                </p>
              </div>
            </div>

            {/* 실행 흐름 - 강조된 스텝 UI */}
            <div className="p-4 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Workflow className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">실행 흐름</span>
              </div>

              {executionSteps.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {executionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                        <span className="opacity-70 mr-1.5">{idx + 1}.</span>
                        {step}
                      </div>
                      {idx < executionSteps.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{task.thought_process.execution_flow}</p>
              )}
            </div>
          </div>

          {/* 피드백 섹션 */}
          {task.gap_analysis.gap_reason && (
            <div className="px-6 py-4 bg-accent/5 border-t border-border/50">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                작업 결과 요약
              </h5>
              <p className="text-sm text-muted-foreground leading-relaxed">{task.gap_analysis.gap_reason}</p>
            </div>
          )}

          {/* 개선 피드백 섹션 */}
          {task.thought_process.improvement_feedback && (
            <div className="px-6 py-4 border-t border-border/50">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {task.thought_process.improvement_feedback.is_flow_appropriate ? (
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-amber-500" />
                )}
                작업 흐름 평가
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  task.thought_process.improvement_feedback.is_flow_appropriate
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {task.thought_process.improvement_feedback.is_flow_appropriate ? '적절함' : '개선 필요'}
                </span>
              </h5>
              <p className="text-sm text-muted-foreground mb-3">
                {task.thought_process.improvement_feedback.flow_assessment}
              </p>
              {task.thought_process.improvement_feedback.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    개선 제안
                  </p>
                  <ul className="space-y-1.5">
                    {task.thought_process.improvement_feedback.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 상호작용별 분석 */}
          {task.interaction_analyses && task.interaction_analyses.length > 0 && (
            <div className="px-6 py-4 border-t border-border/50">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
                상호작용별 분석
                <span className="text-xs font-normal text-muted-foreground">({task.interaction_analyses.length}개)</span>
              </h5>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {task.interaction_analyses.map((analysis, idx) => (
                  <InteractionAnalysisCard key={idx} analysis={analysis} />
                ))}
              </div>
            </div>
          )}

          {/* 작업 흐름 타임라인 - 맨 아래 */}
          {task.thought_process.commit_flow && task.thought_process.commit_flow.length > 0 && (
            <div className="px-6 py-4 border-t border-border/50 bg-accent/5">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                상세 작업 흐름
                <span className="text-xs font-normal text-muted-foreground">({Math.ceil(task.thought_process.commit_flow.length / 2)} 단계)</span>
              </h5>
              <CommitFlowTimeline
                commitFlow={task.thought_process.commit_flow}
                commitRelations={task.thought_process.commit_relations}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CommitFlowTimelineProps {
  commitFlow: Array<{
    hash: string;
    step: number;
    message: string;
  }>;
  commitRelations: Array<{
    from_step: number;
    to_step: number;
    relation: string;
  }>;
}

function CommitFlowTimeline({ commitFlow, commitRelations }: CommitFlowTimelineProps) {
  // 연속된 단계를 쌍으로 합치기 (홀수: 사용자 요청, 짝수: AI 응답)
  const mergedFlow: Array<{
    userStep: typeof commitFlow[0];
    aiStep?: typeof commitFlow[0];
    nextRelation: string | null;
    stepNumber: number;
  }> = [];

  for (let i = 0; i < commitFlow.length; i += 2) {
    const userStep = commitFlow[i];
    const aiStep = commitFlow[i + 1];

    // 다음 관계 찾기 (AI step에서 다음으로의 관계)
    const nextRelation = aiStep
      ? commitRelations.find(r => r.from_step === aiStep.step)?.relation || null
      : commitRelations.find(r => r.from_step === userStep.step)?.relation || null;

    mergedFlow.push({
      userStep,
      aiStep,
      nextRelation,
      stepNumber: Math.ceil((i + 1) / 2),
    });
  }

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case '의존': return 'text-blue-500';
      case '확장': return 'text-green-500';
      case '수정': return 'text-amber-500';
      case '독립': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRelationBg = (relation: string) => {
    switch (relation) {
      case '의존': return 'bg-blue-500/10';
      case '확장': return 'bg-green-500/10';
      case '수정': return 'bg-amber-500/10';
      case '독립': return 'bg-gray-500/10';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="relative pl-6">
      {/* 세로 연결선 */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border/50" />

      <div className="space-y-4">
        {mergedFlow.map((item, idx) => (
          <div key={item.userStep.hash} className="relative">
            {/* 타임라인 노드 */}
            <div className="absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center bg-primary/20 text-primary">
              <MessageSquare className="h-3 w-3" />
            </div>

            {/* 커밋 내용 */}
            <div className="ml-4 p-3 rounded-lg bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  #{item.stepNumber}
                </span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">요청</span>
                </div>
                {item.aiStep && (
                  <>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-purple-500">응답</span>
                    </div>
                  </>
                )}
                <span className="text-xs font-mono text-muted-foreground/60">
                  {item.userStep.hash.substring(0, 7)}
                </span>
              </div>
              <p className="text-sm line-clamp-2">{item.userStep.message}</p>

              {/* 다음 단계와의 관계 */}
              {item.nextRelation && idx < mergedFlow.length - 1 && (
                <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50`}>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRelationBg(item.nextRelation)} ${getRelationColor(item.nextRelation)}`}>
                    {item.nextRelation}
                  </span>
                  <ArrowRight className={`h-3 w-3 ${getRelationColor(item.nextRelation)}`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface InteractionAnalysisCardProps {
  analysis: {
    interaction_id: number;
    prompt_summary: string;
    intent: string;
    status: string;
    outcome: string;
    gap_reason: string | null;
    interaction_type?: 'change' | 'context';
  };
}

function InteractionAnalysisCard({ analysis }: InteractionAnalysisCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500/10 text-green-500';
      case 'PARTIAL': return 'bg-yellow-500/10 text-yellow-500';
      case 'FAIL': return 'bg-red-500/10 text-red-500';
      case 'CONTEXT': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '성공';
      case 'PARTIAL': return '부분';
      case 'FAIL': return '실패';
      case 'CONTEXT': return '맥락';
      default: return status;
    }
  };

  const getTypeStyle = (type?: string) => {
    switch (type) {
      case 'change': return 'bg-purple-500/10 text-purple-500';
      case 'context': return 'bg-cyan-500/10 text-cyan-500';
      default: return '';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'change': return '변경';
      case 'context': return '맥락';
      default: return null;
    }
  };

  return (
    <div className="p-3 rounded-lg bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-xs font-mono text-muted-foreground">#{analysis.interaction_id}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStatusStyle(analysis.status)}`}>
          {getStatusLabel(analysis.status)}
        </span>
        {analysis.interaction_type && getTypeLabel(analysis.interaction_type) && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getTypeStyle(analysis.interaction_type)}`}>
            {getTypeLabel(analysis.interaction_type)}
          </span>
        )}
      </div>
      <p className="text-sm font-medium mb-0.5">{analysis.intent}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{analysis.prompt_summary}</p>
      {analysis.gap_reason && (
        <p className="text-xs text-green-600 mt-1.5 pt-1.5 border-t border-border/50">
          {analysis.gap_reason}
        </p>
      )}
    </div>
  );
}
