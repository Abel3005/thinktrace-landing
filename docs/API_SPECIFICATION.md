# ThinkTrace External API Specification

## Overview

이 문서는 `NEXT_PUBLIC_API_URL` (https://api.thinktrace.net) 서버에서 제공해야 하는 API 명세입니다.

### 아키텍처 변경 사항
- **Supabase (유지)**: `users` 테이블, Authentication
- **Railway DB (이관)**: `repositories`, `commits`, `file_contents`, `commit_files`, `ai_interactions`, `user_statistics` (View)

### 인증 방식
모든 API 요청은 `X-API-Key` 헤더에 API Key를 포함해야 합니다:
```
X-API-Key: {api_key}
```

---

## API Endpoints

### 1. Statistics API

#### GET /api/statistics
사용자 통계 조회

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "username": "string",
    "total_projects": 10,
    "total_snapshots": 150,
    "total_interactions": 45,
    "total_files_changed": 320,
    "total_insertions": 5000,
    "total_deletions": 1200,
    "ai_generated_commits": 30
  }
}
```

---

### 2. Contributions API

#### GET /api/contributions
일일 기여도 데이터 조회 (기존 `get_daily_contributions` RPC 대체)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| userId | string (UUID) | Yes | - | 사용자 ID |
| days | number | No | 365 | 조회할 일수 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-15",
      "commit_count": 5,
      "interaction_count": 3,
      "total_count": 8
    }
  ]
}
```

---

### 3. Projects API

#### GET /api/projects
프로젝트 목록 및 통계 조회 (기존 `get_project_statistics` RPC 대체)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "repo_id": 1,
      "repo_name": "my-project",
      "repo_hash": "abc123def456",
      "description": "Project description",
      "commit_count": 25,
      "interaction_count": 10,
      "files_changed": 50,
      "total_insertions": 1000,
      "total_deletions": 200,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T00:00:00Z"
    }
  ]
}
```

#### GET /api/projects/:projectId
단일 프로젝트 정보 조회

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | number | 프로젝트 ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "repo_name": "my-project",
    "repo_hash": "abc123def456",
    "description": "Project description",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-15T00:00:00Z"
  }
}
```

#### POST /api/projects
새 프로젝트 생성

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "project-name",
  "description": "optional description"
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": 1,
    "repo_name": "project-name",
    "repo_hash": "generated-hash",
    "description": "optional description",
    "created_at": "2025-01-15T00:00:00Z",
    "updated_at": "2025-01-15T00:00:00Z"
  },
  "hash": "generated-hash"
}
```

#### DELETE /api/projects/:projectId
프로젝트 삭제 (아카이브 처리)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | number | 프로젝트 ID |

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### 4. Commits API

#### GET /api/projects/:projectId/commits
프로젝트 커밋 목록 조회

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | number | 프로젝트 ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Initial commit",
      "commit_hash": "full-hash-string",
      "short_hash": "abc123d",
      "committed_at": "2025-01-15T10:00:00Z",
      "prompt_text": "AI prompt if exists",
      "claude_session_id": "session-id",
      "files_changed": 5,
      "insertions": 100,
      "deletions": 20
    }
  ]
}
```

---

### 5. AI Interactions API

#### GET /api/projects/:projectId/interactions
프로젝트 AI 인터랙션 목록 조회

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | number | 프로젝트 ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "repo_id": 1,
      "user_id": "uuid",
      "pre_commit_id": 10,
      "post_commit_id": 11,
      "prompt_text": "User prompt",
      "claude_session_id": "session-id",
      "started_at": "2025-01-15T10:00:00Z",
      "ended_at": "2025-01-15T10:05:00Z",
      "duration_seconds": 300,
      "files_modified": 3,
      "created_at": "2025-01-15T10:05:00Z"
    }
  ]
}
```

---

### 6. Repository Lookup API (for CodeTracker CLI)

#### GET /api/repositories/lookup
repo_hash로 저장소 조회 (CodeTracker 설치 스크립트용)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string (UUID) | Yes | 사용자 ID |
| repoHash | string | No | 저장소 해시 |
| repoName | string | No | 저장소 이름 |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "repo_name": "my-project",
    "repo_hash": "abc123def456"
  }
}
```

#### POST /api/repositories
저장소 생성 (CodeTracker 설치 스크립트용)

**Request Body:**
```json
{
  "userId": "uuid",
  "repoName": "project-name",
  "repoHash": "generated-hash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "repo_name": "project-name",
    "repo_hash": "generated-hash"
  }
}
```

---

### 7. Admin API (관리자 전용)

#### GET /api/admin/statistics
모든 사용자 통계 조회 (관리자 전용)

**Headers:**
```
X-API-Key: {admin_api_key}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "username": "string",
      "total_projects": 10,
      "total_snapshots": 150,
      "total_interactions": 45,
      "total_files_changed": 320,
      "total_insertions": 5000,
      "total_deletions": 1200,
      "ai_generated_commits": 30
    }
  ]
}
```

---

## Error Response Format

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | 인증 실패 (API Key 무효) |
| FORBIDDEN | 403 | 접근 권한 없음 |
| NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| VALIDATION_ERROR | 400 | 요청 데이터 유효성 검증 실패 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## 코드 변환 대상 파일

### 변환 필요 파일 목록

| 파일 | 현재 사용 | 변환 내용 |
|------|----------|----------|
| `lib/supabase/queries.ts` | Supabase RPC/Query | External API 호출로 변경 |
| `app/dashboard/page.tsx` | `user_statistics` 조회 | API 호출로 변경 |
| `app/api/projects/create/route.ts` | `repositories` INSERT | External API 프록시 |
| `app/api/projects/delete/route.ts` | `repositories` UPDATE | External API 프록시 |
| `app/api/download-codetracker/route.ts` | `repositories` 조회 | External API 호출 |
| `app/api/install-script/route.ts` | `repositories` 조회/생성 | External API 호출 |
| `app/dashboard-admin/*` | 다수 테이블 조회 | External API 호출 |
| `components/dashboard/project-detail-content.tsx` | 데이터 표시 | 변경 없음 (props로 받음) |

### 유지되는 Supabase 사용처

| 파일 | 용도 |
|------|------|
| `components/auth/login-form.tsx` | Supabase Auth 로그인 |
| `components/auth/signup-form.tsx` | Supabase Auth 회원가입 + users 테이블 INSERT |
| `components/logout-button.tsx` | Supabase Auth 로그아웃 |
| `app/dashboard/page.tsx` | users 테이블 조회 (본인 정보) |
| `middleware.ts` (없음) | Auth 세션 확인 |

---

## Implementation Notes

1. **API Client 생성**: `lib/api/client.ts`에 외부 API 호출 클라이언트 생성
2. **타입 정의**: `lib/api/types.ts`에 API 응답 타입 정의
3. **에러 핸들링**: 일관된 에러 처리 로직 구현
4. **캐싱 고려**: 적절한 캐싱 전략 적용 (필요시)
