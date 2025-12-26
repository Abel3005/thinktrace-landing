import type { ComprehensiveAssessment } from '@/lib/api/types';

/**
 * TopTask 인터페이스 (top-tasks-report.tsx에서 정의됨)
 */
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

/**
 * Bloom taxonomy 레벨을 점수로 변환
 */
function getBloomLevelScore(bloomLevel: string): number {
  const bloomMap: Record<string, number> = {
    'remember': 1,
    'understand': 2,
    'apply': 3,
    'analyze': 4,
    'evaluate': 5,
    'create': 6,
  };

  const normalized = bloomLevel.toLowerCase().trim();
  return bloomMap[normalized] || 3; // 기본값: apply
}

/**
 * gap_analysis.status를 점수로 변환
 */
function getStatusScore(status: string): number {
  const statusMap: Record<string, number> = {
    'SUCCESS': 100,
    'PARTIAL': 60,
    'MANUAL': 40,
    'CONTEXT': 50,
    'NO_DATA': 30,
    'FAIL': 20,
  };

  return statusMap[status] || 50;
}

/**
 * Bloom 인지 수준 점수 계산 (0-100)
 * effort_score로 가중 평균
 */
export function calculateBloomScore(tasks: TopTask[]): number {
  if (tasks.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  tasks.forEach(task => {
    const bloomScore = getBloomLevelScore(task.persona.bloom);
    const weight = task.effort_score || 1;

    // Bloom 점수를 0-100 범위로 정규화 (1-6 → 0-100)
    const normalizedScore = ((bloomScore - 1) / 5) * 100;

    totalWeightedScore += normalizedScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
}

/**
 * 작업 성공률 점수 계산 (0-100)
 * gap_analysis.success_rate의 effort_score 가중 평균
 */
export function calculateSuccessScore(tasks: TopTask[]): number {
  if (tasks.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  tasks.forEach(task => {
    const successRate = task.gap_analysis.success_rate ?? 50; // null인 경우 50% 기본값
    const weight = task.effort_score || 1;

    totalWeightedScore += successRate * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
}

/**
 * 완료 품질 점수 계산 (0-100)
 * gap_analysis.status 기반 effort_score 가중 평균
 */
export function calculateQualityScore(tasks: TopTask[]): number {
  if (tasks.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  tasks.forEach(task => {
    const statusScore = getStatusScore(task.gap_analysis.status);
    const weight = task.effort_score || 1;

    totalWeightedScore += statusScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
}

/**
 * 작업 흐름 효율성 점수 계산 (0-100)
 * improvement_feedback.is_flow_appropriate가 true인 작업 비율
 */
export function calculateEfficiencyScore(tasks: TopTask[]): number {
  if (tasks.length === 0) return 0;

  const tasksWithFeedback = tasks.filter(
    task => task.thought_process.improvement_feedback !== undefined
  );

  if (tasksWithFeedback.length === 0) return 50; // 피드백 없으면 중립 점수

  const appropriateTasks = tasksWithFeedback.filter(
    task => task.thought_process.improvement_feedback?.is_flow_appropriate === true
  );

  return Math.round((appropriateTasks.length / tasksWithFeedback.length) * 100);
}

/**
 * Bloom taxonomy 레벨별 작업 수 분포
 */
export function getBloomDistribution(tasks: TopTask[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  tasks.forEach(task => {
    const bloom = task.persona.bloom || 'Unknown';
    distribution[bloom] = (distribution[bloom] || 0) + 1;
  });

  return distribution;
}

/**
 * 핵심 스킬별 작업 수 분포
 */
export function getSkillDistribution(tasks: TopTask[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  tasks.forEach(task => {
    const skill = task.persona.core_skill || 'Unknown';
    distribution[skill] = (distribution[skill] || 0) + 1;
  });

  return distribution;
}

/**
 * 숙련도 레벨 결정
 */
function getProficiencyLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (score >= 81) return 'expert';
  if (score >= 61) return 'advanced';
  if (score >= 41) return 'intermediate';
  return 'beginner';
}

/**
 * 종합 평가 계산
 *
 * 총점 = (Bloom 점수 × 0.4) + (성공률 점수 × 0.3) +
 *        (품질 점수 × 0.2) + (효율성 점수 × 0.1)
 */
export function calculateComprehensiveAssessment(tasks: TopTask[]): ComprehensiveAssessment {
  if (tasks.length === 0) {
    return {
      overall_score: 0,
      proficiency_level: 'beginner',
      bloom_score: 0,
      success_score: 0,
      quality_score: 0,
      efficiency_score: 0,
      bloom_distribution: {},
      skill_distribution: {},
      task_count: 0,
    };
  }

  const bloomScore = calculateBloomScore(tasks);
  const successScore = calculateSuccessScore(tasks);
  const qualityScore = calculateQualityScore(tasks);
  const efficiencyScore = calculateEfficiencyScore(tasks);

  // 가중 평균으로 전체 점수 계산
  const overallScore = Math.round(
    bloomScore * 0.4 +
    successScore * 0.3 +
    qualityScore * 0.2 +
    efficiencyScore * 0.1
  );

  return {
    overall_score: overallScore,
    proficiency_level: getProficiencyLevel(overallScore),
    bloom_score: bloomScore,
    success_score: successScore,
    quality_score: qualityScore,
    efficiency_score: efficiencyScore,
    bloom_distribution: getBloomDistribution(tasks),
    skill_distribution: getSkillDistribution(tasks),
    task_count: tasks.length,
  };
}

/**
 * 강점 식별 (상위 3개 영역)
 */
export function identifyStrengths(tasks: TopTask[]): string[] {
  if (tasks.length === 0) return [];

  const strengths: string[] = [];

  // 1. 높은 성공률 작업 카테고리
  const categorySuccessRates: Record<string, { sum: number; count: number }> = {};
  tasks.forEach(task => {
    const cat = task.category;
    const successRate = task.gap_analysis.success_rate ?? 50;

    if (!categorySuccessRates[cat]) {
      categorySuccessRates[cat] = { sum: 0, count: 0 };
    }
    categorySuccessRates[cat].sum += successRate;
    categorySuccessRates[cat].count += 1;
  });

  const topCategory = Object.entries(categorySuccessRates)
    .map(([cat, data]) => ({ category: cat, avg: data.sum / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  if (topCategory && topCategory.avg >= 70) {
    strengths.push(`${topCategory.category} 작업에서 높은 성공률 (${Math.round(topCategory.avg)}%)`);
  }

  // 2. 높은 Bloom 레벨
  const avgBloomScore = calculateBloomScore(tasks);
  if (avgBloomScore >= 60) {
    strengths.push('높은 수준의 인지적 작업 수행');
  }

  // 3. 효율적인 작업 흐름
  const efficiencyScore = calculateEfficiencyScore(tasks);
  if (efficiencyScore >= 70) {
    strengths.push(`효율적인 작업 흐름 (${efficiencyScore}%)`);
  }

  return strengths.slice(0, 3);
}

/**
 * 개선점 식별 (상위 3개 영역)
 */
export function identifyImprovements(tasks: TopTask[]): string[] {
  if (tasks.length === 0) return [];

  const improvements: string[] = [];

  // 1. 낮은 성공률
  const successScore = calculateSuccessScore(tasks);
  if (successScore < 60) {
    improvements.push(`작업 성공률 개선 필요 (현재 ${successScore}%)`);
  }

  // 2. 낮은 품질 점수
  const qualityScore = calculateQualityScore(tasks);
  if (qualityScore < 60) {
    improvements.push(`작업 완료 품질 향상 필요 (현재 ${qualityScore}%)`);
  }

  // 3. 실패 또는 부분 성공이 많은 카테고리
  const categoryFailRates: Record<string, { fail: number; total: number }> = {};
  tasks.forEach(task => {
    const cat = task.category;
    const isFailed = task.gap_analysis.status === 'FAIL' || task.gap_analysis.status === 'PARTIAL';

    if (!categoryFailRates[cat]) {
      categoryFailRates[cat] = { fail: 0, total: 0 };
    }
    if (isFailed) categoryFailRates[cat].fail += 1;
    categoryFailRates[cat].total += 1;
  });

  const worstCategory = Object.entries(categoryFailRates)
    .filter(([_, data]) => data.total >= 2) // 최소 2개 이상 작업
    .map(([cat, data]) => ({ category: cat, failRate: (data.fail / data.total) * 100 }))
    .sort((a, b) => b.failRate - a.failRate)[0];

  if (worstCategory && worstCategory.failRate >= 40) {
    improvements.push(`${worstCategory.category} 작업 성공률 향상 필요`);
  }

  // 4. 낮은 Bloom 레벨
  const bloomScore = calculateBloomScore(tasks);
  if (bloomScore < 50) {
    improvements.push('더 높은 수준의 AI 활용 시도 권장');
  }

  return improvements.slice(0, 3);
}
