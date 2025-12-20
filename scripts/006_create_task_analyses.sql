-- Migration: 006_create_task_analyses
-- Description: 페르소나별 작업 분석 결과를 저장하는 테이블 생성
-- Created: 2024-12-20

-- ============================================================================
-- task_analyses 테이블 생성
-- ============================================================================
-- top_tasks_analysis의 각 작업을 개별 레코드로 저장하여
-- 페르소나별, 카테고리별 분석 및 조회 용이하게 함
-- 분류용 컬럼만 유지하고 상세 데이터는 JSONB로 저장

CREATE TABLE IF NOT EXISTS task_analyses (
    id SERIAL PRIMARY KEY,
    work_tree_id INTEGER REFERENCES work_trees(id) ON DELETE CASCADE,
    repo_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,

    -- 분류용 컬럼 (인덱싱/필터링용)
    task_id VARCHAR(50) NOT NULL,           -- "task_0", "task_2" 등
    persona VARCHAR(100),                    -- "기능 구현자", "버그 탐정", "리팩터링 장인" 등
    category VARCHAR(50),                    -- feature, bugfix, refactor, docs, config, test 등
    gap_status VARCHAR(20),                  -- SUCCESS, PARTIAL, FAIL, CONTEXT_ONLY, NO_DATA
    is_representative BOOLEAN DEFAULT FALSE, -- 해당 페르소나의 대표 작업 여부

    -- 상세 데이터 (원본 그대로 보존)
    task_data JSONB NOT NULL,               -- top_tasks_analysis의 각 task 원본 데이터

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 중복 방지: 같은 work_tree 내 같은 task_id는 하나만
    UNIQUE(work_tree_id, task_id)
);

-- ============================================================================
-- 인덱스 생성
-- ============================================================================

-- 페르소나별 조회
CREATE INDEX idx_task_analyses_persona ON task_analyses(persona);

-- 카테고리별 조회
CREATE INDEX idx_task_analyses_category ON task_analyses(category);

-- 레포지토리별 조회
CREATE INDEX idx_task_analyses_repo_id ON task_analyses(repo_id);

-- Gap 상태별 조회
CREATE INDEX idx_task_analyses_gap_status ON task_analyses(gap_status);

-- 대표 작업 조회 (partial index)
CREATE INDEX idx_task_analyses_representative ON task_analyses(is_representative) WHERE is_representative = TRUE;

-- 복합 인덱스: 페르소나 + 대표 작업
CREATE INDEX idx_task_analyses_persona_representative ON task_analyses(persona, is_representative) WHERE is_representative = TRUE;

-- 생성일 기준 조회
CREATE INDEX idx_task_analyses_created_at ON task_analyses(created_at DESC);

-- 복합 인덱스: 레포지토리 + 카테고리
CREATE INDEX idx_task_analyses_repo_category ON task_analyses(repo_id, category);

-- JSONB 내부 필드 인덱싱 (선택적)
CREATE INDEX idx_task_analyses_task_data ON task_analyses USING GIN (task_data);

-- ============================================================================
-- 코멘트 추가
-- ============================================================================

COMMENT ON TABLE task_analyses IS '페르소나별 작업 분석 결과 저장 테이블 (상세 데이터는 task_data JSONB에 보존)';
COMMENT ON COLUMN task_analyses.task_id IS 'work_tree 내 작업 식별자 (task_0, task_1 등)';
COMMENT ON COLUMN task_analyses.persona IS '작업 유형에 따른 페르소나 (기능 구현자, 버그 탐정 등)';
COMMENT ON COLUMN task_analyses.category IS '작업 카테고리 (feature, bugfix, refactor 등)';
COMMENT ON COLUMN task_analyses.gap_status IS 'Gap Analysis 종합 상태 (SUCCESS, PARTIAL, FAIL, CONTEXT_ONLY)';
COMMENT ON COLUMN task_analyses.is_representative IS '해당 페르소나의 대표 작업 여부 (어드민 지정)';
COMMENT ON COLUMN task_analyses.task_data IS 'top_tasks_analysis 원본 데이터 (effort, gap_analysis, thought_process 등 포함)';

-- ============================================================================
-- 예시 쿼리
-- ============================================================================
/*

-- 페르소나별 작업 분포
SELECT
    persona,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE gap_status = 'SUCCESS') as success_count
FROM task_analyses
WHERE repo_id = 1
GROUP BY persona
ORDER BY task_count DESC;

-- 페르소나별 대표 작업 조회
SELECT
    persona,
    task_data->>'task_name' as task_name,
    task_data->'gap_analysis'->'aggregated'->>'success_rate' as success_rate,
    task_data->'thought_process'->>'user_intent' as user_intent
FROM task_analyses
WHERE is_representative = TRUE;

-- JSONB 필드 접근 예시
SELECT
    task_id,
    task_data->>'task_name' as task_name,
    task_data->>'effort_score' as effort_score,
    task_data->'persona'->>'bloom_level' as bloom_level,
    task_data->'gap_analysis'->'aggregated'->>'status' as gap_status,
    task_data->'thought_process'->'improvement_feedback'->>'is_flow_appropriate' as is_flow_appropriate
FROM task_analyses
WHERE repo_id = 1;

-- 카테고리별 작업 수
SELECT
    category,
    COUNT(*) as task_count
FROM task_analyses
WHERE repo_id = 1
GROUP BY category
ORDER BY task_count DESC;

*/
