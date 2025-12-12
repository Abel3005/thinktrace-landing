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

/**
 * 프로젝트 커밋 데이터 타입
 */
export interface ProjectCommit {
  id: number;
  message: string | null;
  commit_hash: string;
  short_hash: string;
  committed_at: string;
  prompt_text: string | null;
  claude_session_id: string | null;
  files_changed: number;
  insertions: number;
  deletions: number;
}

/**
 * 프로젝트별 커밋 목록 조회
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 UUID
 * @param supabase - Supabase 클라이언트 인스턴스
 * @returns 프로젝트의 커밋 목록
 */
export async function getProjectCommits(
  projectId: number,
  userId: string,
  supabase: SupabaseClient
): Promise<{ data: ProjectCommit[] | null; error: any }> {
  return await supabase
    .from('commits')
    .select('id, message, commit_hash, short_hash, committed_at, prompt_text, claude_session_id, files_changed, insertions, deletions')
    .eq('repo_id', projectId)
    .eq('user_id', userId)
    .order('committed_at', { ascending: false });
}

/**
 * 프로젝트 정보 조회
 */
export interface ProjectInfo {
  id: number;
  repo_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProjectInfo(
  projectId: number,
  userId: string,
  supabase: SupabaseClient
): Promise<{ data: ProjectInfo | null; error: any }> {
  return await supabase
    .from('repositories')
    .select('id, repo_name, description, created_at, updated_at')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();
}

/**
 * AI Interaction 데이터 타입
 */
export interface AIInteraction {
  id: number;
  repo_id: number;
  user_id: string;
  pre_commit_id: number;
  post_commit_id: number;
  prompt_text: string;
  claude_session_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  files_modified: number;
  created_at: string;
}

/**
 * 프로젝트별 AI Interactions 조회
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 UUID
 * @param supabase - Supabase 클라이언트 인스턴스
 * @returns 프로젝트의 AI interaction 목록
 */
export async function getProjectInteractions(
  projectId: number,
  userId: string,
  supabase: SupabaseClient
): Promise<{ data: AIInteraction[] | null; error: any }> {
  return await supabase
    .from('ai_interactions')
    .select('*')
    .eq('repo_id', projectId)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
}
