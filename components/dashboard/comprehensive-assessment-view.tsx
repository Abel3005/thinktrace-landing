"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  AlertCircle,
  Target,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Award,
  BarChart3,
  Brain
} from "lucide-react"
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  calculateComprehensiveAssessment,
  identifyStrengths,
  identifyImprovements
} from '@/lib/utils/assessment'
import type { ComprehensiveAssessment } from '@/lib/api/types'

interface ComprehensiveAssessmentViewProps {
  projectId: number;
  apiKey: string;
}

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
  gap_analysis: {
    intent: string;
    status: 'FAIL' | 'PARTIAL' | 'MANUAL' | 'NO_DATA' | 'SUCCESS' | 'CONTEXT';
    outcome: string;
    gap_reason: string | null;
    success_rate: number | null;
  };
  thought_process: {
    user_intent: string;
    final_outcome: string;
    execution_flow: string;
    improvement_feedback?: {
      suggestions: string[];
      flow_assessment: string;
      is_flow_appropriate: boolean;
    };
  };
}

export function ComprehensiveAssessmentView({ projectId, apiKey }: ComprehensiveAssessmentViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<ComprehensiveAssessment | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchAndCalculateAssessment = async () => {
      setLoading(true);
      setError(null);

      try {
        // work-tree API에서 TopTask 데이터 가져오기
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/work-tree`,
          {
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch work-tree data');
        }

        const data = await response.json();
        const topTasks: TopTask[] = data.top_tasks_analysis || [];

        // 종합 평가 계산
        const calculatedAssessment = calculateComprehensiveAssessment(topTasks);
        setAssessment(calculatedAssessment);

        // 강점과 개선점 식별
        setStrengths(identifyStrengths(topTasks));
        setImprovements(identifyImprovements(topTasks));

      } catch (err) {
        console.error('Error calculating assessment:', err);
        setError('종합 평가를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateAssessment();
  }, [projectId, apiKey]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">종합 평가를 계산하는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  // 데이터 없음
  if (!assessment || assessment.task_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Target className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">충분한 작업 데이터가 필요합니다</p>
        <p className="text-sm mt-2">프로젝트에서 더 많은 작업을 수행한 후 다시 확인해주세요.</p>
      </div>
    );
  }

  // 레벨별 색상 매핑
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/50' };
      case 'advanced': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/50' };
      case 'intermediate': return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/50' };
      default: return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/50' };
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'expert': return '전문가';
      case 'advanced': return '고급';
      case 'intermediate': return '중급';
      default: return '초급';
    }
  };

  const levelColor = getLevelColor(assessment.proficiency_level);

  // RadialBarChart 데이터
  const radialData = [
    {
      name: 'Score',
      value: assessment.overall_score,
      fill: assessment.overall_score >= 81 ? '#22c55e' :
            assessment.overall_score >= 61 ? '#3b82f6' :
            assessment.overall_score >= 41 ? '#eab308' : '#ef4444'
    }
  ];

  // Bloom 분포 PieChart 데이터
  const bloomChartData = Object.entries(assessment.bloom_distribution).map(([level, count]) => ({
    name: level,
    value: count
  }));

  const BLOOM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  // 스킬 분포 BarChart 데이터
  const skillChartData = Object.entries(assessment.skill_distribution).map(([skill, count]) => ({
    name: skill,
    count: count
  }));

  return (
    <div className="space-y-6">
      {/* 전체 점수 섹션 */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI 활용 숙련도 종합 평가
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* 점수 차트 */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-4xl font-bold"
                  >
                    {assessment.overall_score}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* 레벨 배지 및 설명 */}
            <div className="flex-1 text-center md:text-left">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${levelColor.bg} ${levelColor.text} border ${levelColor.border} mb-4`}>
                <Award className="h-5 w-5" />
                <span className="font-bold text-lg">{getLevelLabel(assessment.proficiency_level)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                총 {assessment.task_count}개의 작업을 분석한 결과입니다.
              </p>
              {assessment.task_count < 5 && (
                <p className="text-xs text-yellow-500">
                  ⚠️ 작업 수가 적어 평가 정확도가 제한적일 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 차원별 점수 카드 (2x2 그리드) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Bloom 인지 수준 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Brain className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">블룸 인지 수준</p>
                <p className="text-2xl font-bold">{assessment.bloom_score}</p>
              </div>
            </div>
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${assessment.bloom_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 작업 성공률 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">작업 성공률</p>
                <p className="text-2xl font-bold">{assessment.success_score}%</p>
              </div>
            </div>
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${assessment.success_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 완료 품질 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">완료 품질</p>
                <p className="text-2xl font-bold">{assessment.quality_score}</p>
              </div>
            </div>
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${assessment.quality_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 작업 흐름 효율성 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">작업 흐름 효율성</p>
                <p className="text-2xl font-bold">{assessment.efficiency_score}%</p>
              </div>
            </div>
            <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${assessment.efficiency_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 강점과 개선점 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 강점 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              강점
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">더 많은 작업 데이터가 필요합니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 개선점 */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Lightbulb className="h-5 w-5" />
              개선점
            </CardTitle>
          </CardHeader>
          <CardContent>
            {improvements.length > 0 ? (
              <ul className="space-y-2">
                {improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">→</span>
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">개선이 필요한 영역이 발견되지 않았습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 (토글 가능) */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader
          className="cursor-pointer hover:bg-card/80 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {showDetails ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              상세 분석
            </span>
          </CardTitle>
        </CardHeader>
        {showDetails && (
          <CardContent className="space-y-6">
            {/* Bloom 분포 */}
            {bloomChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-4">Bloom Taxonomy 분포</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bloomChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bloomChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BLOOM_COLORS[index % BLOOM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 스킬 분포 */}
            {skillChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-4">핵심 스킬 분포</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skillChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
