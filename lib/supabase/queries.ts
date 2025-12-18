/**
 * Data Queries
 *
 * 기존 Supabase 쿼리를 External API 호출로 대체
 * - repositories, commits, ai_interactions 등은 NEXT_PUBLIC_API_URL에서 처리
 * - users 테이블만 Supabase에서 직접 조회
 */

import {
  fetchContributionData,
  fetchProjectStatistics,
  fetchProjectCommits,
  fetchProjectInfo,
  fetchProjectInteractions,
} from '@/lib/api/client';

import type {
  ContributionData,
  ProjectStatistics,
  ProjectCommit,
  ProjectInfo,
  AIInteraction,
} from '@/lib/api/types';

// Re-export types for backward compatibility
export type { ContributionData, ProjectStatistics, ProjectCommit, ProjectInfo, AIInteraction };

/**
 * 일일 기여도 데이터 조회
 *
 * @param userId - 사용자 UUID
 * @param _supabase - (deprecated) 더 이상 사용하지 않음
 * @param days - 조회할 일수 (기본값: 365일)
 * @param apiKey - API Key (선택)
 * @returns 날짜별 커밋 및 AI 인터랙션 통계
 */
export async function getContributionData(
  userId: string,
  _supabase?: unknown, // backward compatibility
  days: number = 365,
  apiKey?: string
): Promise<{ data: ContributionData[] | null; error: Error | null }> {
  try {
    const data = await fetchContributionData(userId, days, apiKey);
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch contribution data:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * 프로젝트별 통계 데이터 조회
 *
 * @param userId - 사용자 UUID
 * @param _supabase - (deprecated) 더 이상 사용하지 않음
 * @param apiKey - API Key (선택)
 * @returns 프로젝트별 커밋, AI 인터랙션, 파일 변경 통계
 */
export async function getProjectStatistics(
  userId: string,
  _supabase?: unknown, // backward compatibility
  apiKey?: string
): Promise<{ data: ProjectStatistics[] | null; error: Error | null }> {
  try {
    const data = await fetchProjectStatistics(userId, apiKey);
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch project statistics:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * 프로젝트별 커밋 목록 조회
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 UUID
 * @param _supabase - (deprecated) 더 이상 사용하지 않음
 * @param apiKey - API Key (선택)
 * @returns 프로젝트의 커밋 목록
 */
export async function getProjectCommits(
  projectId: number,
  userId: string,
  _supabase?: unknown, // backward compatibility
  apiKey?: string
): Promise<{ data: ProjectCommit[] | null; error: Error | null }> {
  try {
    const data = await fetchProjectCommits(projectId, userId, apiKey);
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch project commits:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * 프로젝트 정보 조회
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 UUID
 * @param _supabase - (deprecated) 더 이상 사용하지 않음
 * @param apiKey - API Key (선택)
 * @returns 프로젝트 정보
 */
export async function getProjectInfo(
  projectId: number,
  userId: string,
  _supabase?: unknown, // backward compatibility
  apiKey?: string
): Promise<{ data: ProjectInfo | null; error: Error | null }> {
  try {
    const data = await fetchProjectInfo(projectId, userId, apiKey);
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch project info:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * 프로젝트별 AI Interactions 조회
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 UUID
 * @param _supabase - (deprecated) 더 이상 사용하지 않음
 * @param apiKey - API Key (선택)
 * @returns 프로젝트의 AI interaction 목록
 */
export async function getProjectInteractions(
  projectId: number,
  userId: string,
  _supabase?: unknown, // backward compatibility
  apiKey?: string
): Promise<{ data: AIInteraction[] | null; error: Error | null }> {
  try {
    const data = await fetchProjectInteractions(projectId, userId, apiKey);
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch project interactions:', error);
    return { data: null, error: error as Error };
  }
}
