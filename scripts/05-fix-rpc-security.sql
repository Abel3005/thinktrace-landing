-- Migration: Fix RPC function to work with SECURITY DEFINER and RLS
-- Description: RPC 함수가 RLS와 함께 정상 작동하도록 수정
-- Created: 2025-12-10

-- Method 1: 가장 간단한 방법 - SECURITY INVOKER로 변경
-- 이렇게 하면 호출자의 권한으로 실행되어 RLS가 정상 작동합니다
DROP FUNCTION IF EXISTS get_project_statistics(uuid);

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
)
LANGUAGE plpgsql
SECURITY INVOKER  -- 호출자 권한으로 실행 (RLS 적용됨)
AS $$
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
$$;

-- get_daily_contributions도 동일하게 수정
DROP FUNCTION IF EXISTS get_daily_contributions(uuid, integer);

CREATE OR REPLACE FUNCTION get_daily_contributions(
  p_user_id uuid,
  p_days integer DEFAULT 365
)
RETURNS TABLE (
  date date,
  commit_count bigint,
  interaction_count bigint,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY INVOKER  -- 호출자 권한으로 실행 (RLS 적용됨)
AS $$
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
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_project_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_contributions(uuid, integer) TO authenticated;

-- 검증 쿼리 (선택사항)
-- SELECT * FROM get_project_statistics(auth.uid());
