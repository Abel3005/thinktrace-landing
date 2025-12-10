import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 일일 기여도 데이터 타입
 * - Supabase RPC 함수 get_daily_contributions의 반환 타입
 */
export interface ContributionData {
  date: string; // ISO date string (YYYY-MM-DD)
  commit_count: number;
  interaction_count: number;
  total_count: number;
}

/**
 * 프로젝트 통계 데이터 타입
 * - Supabase RPC 함수 get_project_statistics의 반환 타입
 */
export interface ProjectStatistics {
  repo_id: number;
  repo_name: string;
  description: string | null;
  commit_count: number;
  interaction_count: number;
  files_changed: number;
  total_insertions: number;
  total_deletions: number;
  created_at: string;
  updated_at: string;
}

/**
 * 일일 기여도 데이터 조회
 *
 * @param userId - 사용자 UUID
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param days - 조회할 일수 (기본값: 365일)
 * @returns 날짜별 커밋 및 AI 인터랙션 통계
 *
 * @example
 * const { data, error } = await getContributionData(userId, supabase, 365);
 * if (data) {
 *   console.log(`Total days with activity: ${data.filter(d => d.total_count > 0).length}`);
 * }
 */
export async function getContributionData(
  userId: string,
  supabase: SupabaseClient,
  days: number = 365
): Promise<{ data: ContributionData[] | null; error: any }> {
  return await supabase.rpc('get_daily_contributions', {
    p_user_id: userId,
    p_days: days
  });
}

/**
 * 프로젝트별 통계 데이터 조회
 *
 * @param userId - 사용자 UUID
 * @param supabase - Supabase 클라이언트 인스턴스
 * @returns 프로젝트별 커밋, AI 인터랙션, 파일 변경 통계
 *
 * @example
 * const { data, error } = await getProjectStatistics(userId, supabase);
 * if (data) {
 *   console.log(`Total projects: ${data.length}`);
 *   data.forEach(project => {
 *     console.log(`${project.repo_name}: ${project.commit_count} commits`);
 *   });
 * }
 */
export async function getProjectStatistics(
  userId: string,
  supabase: SupabaseClient
): Promise<{ data: ProjectStatistics[] | null; error: any }> {
  return await supabase.rpc('get_project_statistics', {
    p_user_id: userId
  });
}
