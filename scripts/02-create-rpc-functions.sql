-- Migration: Create RPC functions for dashboard statistics
-- Description: 일일 기여도 집계 및 프로젝트별 통계 조회 함수
-- Created: 2025-12-09

-- ============================================================================
-- Function 1: get_daily_contributions
-- Purpose: 날짜별 커밋 + AI 인터랙션 집계 (최근 N일)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_contributions(
  p_user_id uuid,
  p_days integer DEFAULT 365
)
RETURNS TABLE (
  date date,
  commit_count bigint,
  interaction_count bigint,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(
      CURRENT_DATE - p_days + 1,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS day
  ),
  commits_by_day AS (
    SELECT
      DATE(committed_at AT TIME ZONE 'UTC') AS day,
      COUNT(*) AS count
    FROM commits
    WHERE user_id = p_user_id
      AND committed_at >= CURRENT_DATE - p_days + 1
    GROUP BY DATE(committed_at AT TIME ZONE 'UTC')
  ),
  interactions_by_day AS (
    SELECT
      DATE(started_at AT TIME ZONE 'UTC') AS day,
      COUNT(*) AS count
    FROM ai_interactions
    WHERE user_id = p_user_id
      AND started_at >= CURRENT_DATE - p_days + 1
    GROUP BY DATE(started_at AT TIME ZONE 'UTC')
  )
  SELECT
    dr.day AS date,
    COALESCE(c.count, 0) AS commit_count,
    COALESCE(i.count, 0) AS interaction_count,
    COALESCE(c.count, 0) + COALESCE(i.count, 0) AS total_count
  FROM date_range dr
  LEFT JOIN commits_by_day c ON dr.day = c.day
  LEFT JOIN interactions_by_day i ON dr.day = i.day
  ORDER BY dr.day ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function 2: get_project_statistics
-- Purpose: 프로젝트별 상세 통계 (커밋, AI 인터랙션, 파일 변경, 코드 증감)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_project_statistics(p_user_id uuid)
RETURNS TABLE (
  repo_id integer,
  repo_name text,
  description text,
  commit_count bigint,
  interaction_count bigint,
  files_changed bigint,
  total_insertions bigint,
  total_deletions bigint,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS repo_id,
    r.repo_name,
    r.description,
    COALESCE(c.commit_count, 0) AS commit_count,
    COALESCE(ai.interaction_count, 0) AS interaction_count,
    COALESCE(c.total_files_changed, 0) AS files_changed,
    COALESCE(c.total_insertions, 0) AS total_insertions,
    COALESCE(c.total_deletions, 0) AS total_deletions,
    r.created_at,
    r.updated_at
  FROM repositories r
  LEFT JOIN (
    SELECT
      repo_id,
      COUNT(*) AS commit_count,
      SUM(files_changed) AS total_files_changed,
      SUM(insertions) AS total_insertions,
      SUM(deletions) AS total_deletions
    FROM commits
    WHERE user_id = p_user_id
    GROUP BY repo_id
  ) c ON r.id = c.repo_id
  LEFT JOIN (
    SELECT
      repo_id,
      COUNT(*) AS interaction_count
    FROM ai_interactions
    WHERE user_id = p_user_id
    GROUP BY repo_id
  ) ai ON r.id = ai.repo_id
  WHERE r.user_id = p_user_id
  ORDER BY r.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Performance Indexes
-- Purpose: 쿼리 성능 최적화
-- ============================================================================

-- commits 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_commits_user_date
  ON commits(user_id, committed_at DESC);

CREATE INDEX IF NOT EXISTS idx_commits_repo
  ON commits(repo_id);

-- ai_interactions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_date
  ON ai_interactions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_repo
  ON ai_interactions(repo_id);

-- repositories 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_repositories_user_updated
  ON repositories(user_id, updated_at DESC);

-- ============================================================================
-- Verification Queries (Optional - for testing)
-- ============================================================================

-- Test get_daily_contributions function:
-- SELECT * FROM get_daily_contributions('your-user-id-here'::uuid, 30);

-- Test get_project_statistics function:
-- SELECT * FROM get_project_statistics('your-user-id-here'::uuid);
