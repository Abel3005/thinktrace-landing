# Git Commit History Analyzer - External API Integration Guide

본 문서는 외부 모듈에서 Git Commit History Analyzer API를 호출하기 위한 상세 가이드입니다.

## 목차

- [개요](#개요)
- [API 엔드포인트](#api-엔드포인트)
- [데이터 스키마](#데이터-스키마)
- [요청 예시](#요청-예시)
- [응답 형식](#응답-형식)
- [에러 처리](#에러-처리)
- [코드 예시](#코드-예시)

---

## 개요

Git Commit History Analyzer는 Git 커밋 데이터를 분석하여 논리적 작업 구조(Work Tree)를 도출하는 서비스입니다.

**두 가지 연동 방식:**
1. **Git 기반 분석**: Repository URL 제공 → 자동 클론 및 분석
2. **외부 데이터 분석**: 사전 처리된 커밋 데이터 제공 → 즉시 분석 (본 문서의 대상)

**Base URL:** `http://localhost:5000`

---

## API 엔드포인트

### 1. 워크트리 분석 API

```
POST /api/analyze-external
```

커밋 데이터를 분석하여 논리적 작업 구조를 생성합니다.

**특징:**
- Claude AI를 사용한 작업 구조 도출
- M:N 관계 지원 (1개 작업 → 여러 커밋, 1개 커밋 → 여러 작업)
- MECE 원칙 기반 계층 구조 생성

---

### 2. 태스크 상세 정보 API

```
POST /api/task-detail-external
```

특정 작업의 상세 정보 및 AI 기반 요약을 제공합니다.

---

### 3. 스키마 문서 조회 API

```
GET /api/data-schema
```

데이터 스키마 정의 및 예시 데이터를 반환합니다.

---

## 데이터 스키마

### 전체 구조

```typescript
{
  repo_name: string,        // 프로젝트 이름
  commits: CommitData[]     // 커밋 목록 (오래된 것부터 최신 순)
}
```

### CommitData 구조

```typescript
{
  hash: string,             // 전체 커밋 해시 (40자)
  short_hash: string,       // 짧은 해시 (7자 권장)
  message: string,          // 커밋 메시지
  author: string,           // "Name <email@example.com>" 형식
  date: string,             // ISO 8601 형식 (예: "2024-01-15T10:30:00+09:00")
  diffs: DiffData[],        // 파일 변경 목록
  stats: CommitStats        // 통계 정보
}
```

### DiffData 구조

```typescript
{
  file: string,             // 파일 경로 (예: "src/main.py")
  change_type: string,      // "A" | "M" | "D" | "R"
  diff?: string             // (선택) unified diff 텍스트
}
```

**change_type 값:**
- `"A"`: Added (파일 추가)
- `"M"`: Modified (파일 수정)
- `"D"`: Deleted (파일 삭제)
- `"R"`: Renamed (파일 이름 변경)

### CommitStats 구조

```typescript
{
  insertions: number,       // 추가된 라인 수
  deletions: number,        // 삭제된 라인 수
  lines: number,            // 총 변경 라인 수 (insertions + deletions)
  files: number             // 변경된 파일 개수
}
```

---

## 요청 예시

### 1. 워크트리 분석 요청

**Endpoint:** `POST /api/analyze-external`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "repo_name": "example-project",
  "commits": [
    {
      "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      "short_hash": "a1b2c3d",
      "message": "Add user authentication feature",
      "author": "John Doe <john@example.com>",
      "date": "2024-01-15T10:30:00+09:00",
      "diffs": [
        {
          "file": "src/auth.py",
          "change_type": "A",
          "diff": "@@ -0,0 +1,50 @@\n+def login(username, password):\n+    pass"
        },
        {
          "file": "src/models.py",
          "change_type": "M",
          "diff": "@@ -10,5 +10,15 @@\n class User:\n+    def authenticate(self):\n+        pass"
        }
      ],
      "stats": {
        "insertions": 65,
        "deletions": 5,
        "lines": 70,
        "files": 2
      }
    },
    {
      "hash": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1",
      "short_hash": "b2c3d4e",
      "message": "Fix login bug",
      "author": "Jane Smith <jane@example.com>",
      "date": "2024-01-16T14:20:00+09:00",
      "diffs": [
        {
          "file": "src/auth.py",
          "change_type": "M",
          "diff": "@@ -20,1 +20,1 @@\n-    if password == None:\n+    if password is None:"
        }
      ],
      "stats": {
        "insertions": 1,
        "deletions": 1,
        "lines": 2,
        "files": 1
      }
    }
  ]
}
```

---

### 2. 태스크 상세 정보 요청

**Endpoint:** `POST /api/task-detail-external`

**Request Body:**
```json
{
  "task_name": "User Authentication",
  "commit_hashes": ["a1b2c3d", "b2c3d4e"],
  "commits": [
    // 전체 커밋 데이터 배열 (analyze-external과 동일한 형식)
  ]
}
```

---

## 응답 형식

### 1. 워크트리 분석 응답

**Success Response (200):**
```json
{
  "success": true,
  "repo_name": "example-project",
  "total_commits": 10,
  "work_tree": {
    "nodes": {
      "task_0": {
        "id": "task_0",
        "task_name": "User Authentication",
        "task_description": "Implement login and JWT handling",
        "category": "feature",
        "commit_hashes": ["a1b2c3d", "b2c3d4e"],
        "commit_messages": ["Add user authentication feature", "Fix login bug"]
      },
      "group_0": {
        "id": "group_0",
        "task_name": "Backend Features",
        "task_description": "Core backend functionality",
        "category": "feature",
        "commit_hashes": [],
        "commit_messages": []
      }
    },
    "relationships": [
      {
        "from": "task_0",
        "to": "task_1",
        "type": "dependency"
      },
      {
        "from": "group_0",
        "to": "task_0",
        "type": "parent"
      }
    ]
  }
}
```

**카테고리 종류:**
- `feature`: 새 기능 추가
- `bugfix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 작업
- `test`: 테스트 추가/수정
- `config`: 설정 변경
- `other`: 기타

**관계 타입:**
- `parent`: 부모-자식 관계 (계층 구조)
- `dependency`: 의존 관계 (선행 작업)

---

### 2. 태스크 상세 정보 응답

**Success Response (200):**
```json
{
  "success": true,
  "task_name": "User Authentication",
  "stats": {
    "insertions": 150,
    "deletions": 20,
    "files_changed": 5,
    "total_lines": 170
  },
  "summary": "This task implements user authentication using JWT tokens. The login endpoint validates credentials and returns an access token. Session management is handled through secure HTTP-only cookies.",
  "commits": [
    {
      "hash": "a1b2c3d",
      "message": "Add user authentication feature",
      "author": "John Doe <john@example.com>",
      "date": "2024-01-15T10:30:00+09:00",
      "stats": {
        "insertions": 65,
        "deletions": 5,
        "lines": 70,
        "files": 2
      }
    }
  ]
}
```

---

## 에러 처리

### 에러 응답 형식

```json
{
  "error": "Error message description"
}
```

### 주요 에러 코드

| HTTP Status | 설명 | 원인 |
|-------------|------|------|
| `400` | Bad Request | 잘못된 데이터 형식, 필수 필드 누락 |
| `404` | Not Found | 요청한 커밋을 찾을 수 없음 |
| `500` | Internal Server Error | API 키 미설정, 서버 내부 오류 |

### 검증 에러 예시

```json
{
  "error": "Invalid data format: Missing 'repo_name' field"
}
```

```json
{
  "error": "Invalid data format: Invalid commit data at index 2"
}
```

---

## 코드 예시

### Python

```python
import requests
import json

def analyze_commits(repo_name: str, commits: list) -> dict:
    """
    커밋 데이터를 분석하여 워크트리를 생성합니다.

    Args:
        repo_name: 프로젝트 이름
        commits: 커밋 데이터 리스트

    Returns:
        분석 결과 딕셔너리
    """
    url = "http://localhost:5000/api/analyze-external"

    payload = {
        "repo_name": repo_name,
        "commits": commits
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text}")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        raise


def get_task_detail(task_name: str, commit_hashes: list, all_commits: list) -> dict:
    """
    특정 태스크의 상세 정보를 조회합니다.

    Args:
        task_name: 태스크 이름
        commit_hashes: 태스크에 속한 커밋 해시 리스트
        all_commits: 전체 커밋 데이터

    Returns:
        태스크 상세 정보 딕셔너리
    """
    url = "http://localhost:5000/api/task-detail-external"

    payload = {
        "task_name": task_name,
        "commit_hashes": commit_hashes,
        "commits": all_commits
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text}")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        raise


# 사용 예시
if __name__ == "__main__":
    # 예시 커밋 데이터
    commits = [
        {
            "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
            "short_hash": "a1b2c3d",
            "message": "Add user authentication feature",
            "author": "John Doe <john@example.com>",
            "date": "2024-01-15T10:30:00+09:00",
            "diffs": [
                {
                    "file": "src/auth.py",
                    "change_type": "A",
                    "diff": ""
                }
            ],
            "stats": {
                "insertions": 65,
                "deletions": 5,
                "lines": 70,
                "files": 1
            }
        }
    ]

    # 워크트리 분석
    result = analyze_commits("my-project", commits)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # 태스크 상세 정보 조회
    if result["success"]:
        task_detail = get_task_detail(
            task_name="User Authentication",
            commit_hashes=["a1b2c3d"],
            all_commits=commits
        )
        print(json.dumps(task_detail, indent=2, ensure_ascii=False))
```

---

### JavaScript (Node.js)

```javascript
const axios = require('axios');

/**
 * 커밋 데이터를 분석하여 워크트리를 생성합니다.
 */
async function analyzeCommits(repoName, commits) {
  const url = 'http://localhost:5000/api/analyze-external';

  try {
    const response = await axios.post(url, {
      repo_name: repoName,
      commits: commits
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
      throw new Error(`HTTP ${error.response.status}: ${error.response.data.error}`);
    }
    throw error;
  }
}

/**
 * 특정 태스크의 상세 정보를 조회합니다.
 */
async function getTaskDetail(taskName, commitHashes, allCommits) {
  const url = 'http://localhost:5000/api/task-detail-external';

  try {
    const response = await axios.post(url, {
      task_name: taskName,
      commit_hashes: commitHashes,
      commits: allCommits
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
      throw new Error(`HTTP ${error.response.status}: ${error.response.data.error}`);
    }
    throw error;
  }
}

// 사용 예시
(async () => {
  const commits = [
    {
      hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      short_hash: "a1b2c3d",
      message: "Add user authentication feature",
      author: "John Doe <john@example.com>",
      date: "2024-01-15T10:30:00+09:00",
      diffs: [
        {
          file: "src/auth.py",
          change_type: "A",
          diff: ""
        }
      ],
      stats: {
        insertions: 65,
        deletions: 5,
        lines: 70,
        files: 1
      }
    }
  ];

  try {
    // 워크트리 분석
    const result = await analyzeCommits("my-project", commits);
    console.log(JSON.stringify(result, null, 2));

    // 태스크 상세 정보 조회
    if (result.success) {
      const taskDetail = await getTaskDetail(
        "User Authentication",
        ["a1b2c3d"],
        commits
      );
      console.log(JSON.stringify(taskDetail, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

---

### cURL

```bash
# 워크트리 분석
curl -X POST http://localhost:5000/api/analyze-external \
  -H "Content-Type: application/json" \
  -d '{
    "repo_name": "example-project",
    "commits": [
      {
        "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
        "short_hash": "a1b2c3d",
        "message": "Add user authentication feature",
        "author": "John Doe <john@example.com>",
        "date": "2024-01-15T10:30:00+09:00",
        "diffs": [
          {
            "file": "src/auth.py",
            "change_type": "A",
            "diff": ""
          }
        ],
        "stats": {
          "insertions": 65,
          "deletions": 5,
          "lines": 70,
          "files": 1
        }
      }
    ]
  }'

# 태스크 상세 정보 조회
curl -X POST http://localhost:5000/api/task-detail-external \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "User Authentication",
    "commit_hashes": ["a1b2c3d"],
    "commits": [...]
  }'

# 스키마 문서 조회
curl -X GET http://localhost:5000/api/data-schema
```

---

## 데이터 검증 규칙

### 필수 검증 항목

1. **repo_name**
   - 타입: `string`
   - 빈 문자열 불가

2. **commits**
   - 타입: `array`
   - 최소 1개 이상의 커밋 필요
   - 오래된 커밋부터 최신 순서로 정렬

3. **각 커밋의 필수 필드**
   - `hash`, `short_hash`, `message`, `author`, `date`: 모두 `string`
   - `diffs`: `array`
   - `stats`: `object`

4. **diffs 배열의 각 항목**
   - `file`: `string` (필수)
   - `change_type`: `string` (필수, "A"|"M"|"D"|"R")
   - `diff`: `string` (선택)

5. **stats 객체**
   - `insertions`, `deletions`, `lines`, `files`: 모두 `number` (정수)
   - `lines` = `insertions` + `deletions`

### 날짜 형식

ISO 8601 형식을 사용해야 합니다:

**권장 형식:**
```
2024-01-15T10:30:00+09:00
2024-01-15T10:30:00Z
2024-01-15T10:30:00.000Z
```

**지원되지 않는 형식:**
```
2024-01-15 10:30:00
01/15/2024
15-Jan-2024
```

---

## FAQ

### Q1. diff 필드는 항상 제공해야 하나요?

A: 아니요, `diff` 필드는 선택사항입니다. 빈 문자열(`""`)로 전송해도 됩니다. 하지만 제공할 경우 더 정확한 분석이 가능합니다.

### Q2. 커밋 순서가 중요한가요?

A: 네, 커밋은 **오래된 것부터 최신 순서**로 정렬되어야 합니다. 이는 작업 흐름을 파악하는 데 중요합니다.

### Q3. 몇 개의 커밋까지 분석 가능한가요?

A: 기술적으로는 제한이 없지만, Claude API 토큰 제한 및 비용을 고려하여 **5-50개** 범위를 권장합니다.

### Q4. 분석 결과는 캐시되나요?

A: 아니요, 각 요청마다 새로운 분석을 수행합니다. 결과를 재사용하려면 클라이언트 측에서 저장해야 합니다.

### Q5. 응답 시간은 얼마나 걸리나요?

A: Claude API 호출이 포함되므로 커밋 개수에 따라 **5-30초** 소요될 수 있습니다.

---

## 지원 및 문의

- GitHub Issues: [프로젝트 저장소]
- 문서 버전: 1.0
- 마지막 업데이트: 2025-12-12
