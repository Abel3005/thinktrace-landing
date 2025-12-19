/**
 * External API Types
 * NEXT_PUBLIC_API_URL 서버 응답 타입 정의
 */

// ============================================================================
// User Statistics
// ============================================================================

export interface UserStatistics {
  user_id: string;
  username: string;
  total_projects: number;
  total_snapshots: number;
  total_interactions: number;
  total_files_changed: number;
  total_insertions: number;
  total_deletions: number;
  ai_generated_commits: number;
}

// ============================================================================
// Contribution Data
// ============================================================================

export interface ContributionData {
  date: string; // ISO date string (YYYY-MM-DD)
  commit_count: number;
  interaction_count: number;
  total_count: number;
}

// ============================================================================
// Project / Repository
// ============================================================================

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

export interface ProjectInfo {
  id: number;
  repo_name: string;
  repo_hash: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositoryLookup {
  id: number;
  repo_name: string;
  repo_hash: string;
}

// ============================================================================
// Commits
// ============================================================================

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

// ============================================================================
// AI Interactions
// ============================================================================

export interface AIInteraction {
  id: number;
  repo_id: number;
  user_id: string;
  pre_commit_id: number;
  post_commit_id: number;
  prompt_text: string;
  claude_session_id: string | null;
  conversation_start_id: number | null;
  conversation_end_id: number | null;
  commit_hash?: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  files_modified: number;
  created_at: string;
}

// ============================================================================
// Conversation Messages
// ============================================================================

export interface ConversationMessage {
  id: number;
  interaction_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateProjectRequest {
  userId: string;
  name: string;
  description?: string;
}

export interface DeleteProjectRequest {
  userId: string;
}

export interface CreateRepositoryRequest {
  userId: string;
  repoName: string;
  repoHash: string;
}
