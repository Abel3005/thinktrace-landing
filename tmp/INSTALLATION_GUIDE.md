# CodeTracker 설치 가이드 (Go 바이너리)

CodeTracker를 시스템 전체에 설치하는 가이드입니다. Go 바이너리 버전은 **런타임 의존성이 없어** Node.js 설치가 필요하지 않습니다.

## 사전 요구사항

- **없음!** - Go 바이너리는 단독 실행 파일로 별도 런타임이 필요하지 않습니다.
- **자동 설치 스크립트** 사용 시: Python 3 (macOS/Linux) 또는 PowerShell (Windows)

## 중요사항

**기존 설치 안전 보호**

설치 스크립트는 기존 설치를 감지하면 자동으로 업데이트 모드로 전환됩니다:
- ✅ **기존 `~/.claude/settings.json`**: 보존되고 CodeTracker hooks만 추가/병합
- ✅ **기존 `~/.codetracker/credentials.json`**: API 키와 인증 정보 보존
- ✅ **기존 `~/.codetracker/cache/`**: 세션 캐시 보존
- ✅ **업데이트 항목**: `config.json`, hooks 바이너리만 새 버전으로 교체

동일한 스크립트를 다시 실행하면 안전하게 업데이트됩니다!

## 설치 단계

### 1. 웹사이트에서 사용자 등록

1. CodeTracker 웹사이트에 접속
2. 계정 생성 및 로그인
3. **플랫폼 선택 후** 설정 파일 다운로드 또는 설치 스크립트 실행

### 2. 설치 방법

#### 방법 A: 자동 설치 스크립트 (권장)

**macOS/Linux:**
```bash
curl -fsSL -H "X-API-Key: YOUR_API_KEY" \
  "https://your-server.com/api/install-script?projectHash=YOUR_PROJECT_HASH&os=mac" | bash
```

**Windows (PowerShell):**
```powershell
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString("https://your-server.com/api/install-script?projectHash=YOUR_PROJECT_HASH&os=windows"))
```

#### 방법 B: 수동 설치

1. 웹사이트에서 zip 파일 다운로드
2. 임시 디렉터리에 압축 해제
3. 홈 디렉터리로 파일 복사:

**macOS/Linux:**
```bash
# 압축 해제
unzip codetracker_*.zip -d /tmp/codetracker

# 홈 디렉터리로 복사
mkdir -p ~/.codetracker
mkdir -p ~/.claude/hooks

cp -r /tmp/codetracker/.codetracker/* ~/.codetracker/
cp -r /tmp/codetracker/.claude/hooks/* ~/.claude/hooks/

# settings.json 병합 (Python 필요)
python3 - <<'EOF'
import json
from pathlib import Path

home = Path.home()
existing_settings_path = home / ".claude" / "settings.json"
new_settings_path = Path("/tmp/codetracker/.claude/settings.json")

with open(new_settings_path, "r") as f:
    new_settings = json.load(f)

if existing_settings_path.exists():
    with open(existing_settings_path, "r") as f:
        existing_settings = json.load(f)
    if "hooks" not in existing_settings:
        existing_settings["hooks"] = {}
    for hook_type, hook_configs in new_settings.get("hooks", {}).items():
        existing_settings["hooks"][hook_type] = hook_configs
    final_settings = existing_settings
else:
    final_settings = new_settings

with open(existing_settings_path, "w") as f:
    json.dump(final_settings, f, indent=2)
EOF

# 실행 권한 부여
chmod +x ~/.claude/hooks/user_prompt_submit
chmod +x ~/.claude/hooks/stop

# 정리
rm -rf /tmp/codetracker
```

**Windows (PowerShell):**
```powershell
# 압축 해제
Expand-Archive -Path codetracker_*.zip -DestinationPath $env:TEMP\codetracker -Force

# 홈 디렉터리로 복사
New-Item -ItemType Directory -Path "$env:USERPROFILE\.codetracker" -Force
New-Item -ItemType Directory -Path "$env:USERPROFILE\.claude\hooks" -Force

Copy-Item -Path "$env:TEMP\codetracker\.codetracker\*" -Destination "$env:USERPROFILE\.codetracker" -Recurse -Force
Copy-Item -Path "$env:TEMP\codetracker\.claude\hooks\*" -Destination "$env:USERPROFILE\.claude\hooks" -Recurse -Force

# settings.json 병합
$newSettingsPath = "$env:TEMP\codetracker\.claude\settings.json"
$existingSettingsPath = "$env:USERPROFILE\.claude\settings.json"

$newSettings = Get-Content $newSettingsPath -Raw | ConvertFrom-Json

if (Test-Path $existingSettingsPath) {
    $existingSettings = Get-Content $existingSettingsPath -Raw | ConvertFrom-Json
    if (-not $existingSettings.PSObject.Properties['hooks']) {
        $existingSettings | Add-Member -MemberType NoteProperty -Name 'hooks' -Value @{}
    }
    foreach ($hookType in $newSettings.hooks.PSObject.Properties.Name) {
        $existingSettings.hooks | Add-Member -MemberType NoteProperty -Name $hookType -Value $newSettings.hooks.$hookType -Force
    }
    $finalSettings = $existingSettings
} else {
    $finalSettings = $newSettings
}

$finalSettings | ConvertTo-Json -Depth 10 | Set-Content $existingSettingsPath -Encoding UTF8

# 정리
Remove-Item "$env:TEMP\codetracker" -Recurse -Force
```

### 3. 설치 확인

설치 후 디렉터리 구조:

**macOS/Linux:**
```
$HOME/
├── .codetracker/
│   ├── config.json          # 전역 설정
│   ├── credentials.json     # API 키 (보안 유지!)
│   └── cache/               # 자동 생성됨
└── .claude/
    ├── settings.json        # Claude Code 훅 설정
    └── hooks/
        ├── user_prompt_submit   # Go 바이너리
        └── stop                 # Go 바이너리
```

**Windows:**
```
%USERPROFILE%\
├── .codetracker\
│   ├── config.json          # 전역 설정
│   ├── credentials.json     # API 키 (보안 유지!)
│   └── cache\               # 자동 생성됨
└── .claude\
    ├── settings.json        # Claude Code 훅 설정
    └── hooks\
        ├── user_prompt_submit.exe   # Go 바이너리
        └── stop.exe                 # Go 바이너리
```

### 4. 설치 테스트

#### 방법 1: 수동 테스트

**macOS/Linux - user_prompt_submit 테스트:**
```bash
echo '{"prompt":"test prompt","session_id":"test-123","timestamp":"2024-01-01T00:00:00Z"}' | \
  ~/.claude/hooks/user_prompt_submit
```

성공하면 `~/.codetracker/cache/current_session.json` 파일이 생성됩니다:
```bash
cat ~/.codetracker/cache/current_session.json
```

**macOS/Linux - stop 테스트:**
```bash
echo '{"timestamp":"2024-01-01T00:00:10Z"}' | \
  ~/.claude/hooks/stop
```

성공하면 세션 파일이 삭제됩니다:
```bash
ls ~/.codetracker/cache/  # current_session.json이 없어야 함
```

**Windows - user_prompt_submit 테스트:**
```powershell
'{"prompt":"test prompt","session_id":"test-123","timestamp":"2024-01-01T00:00:00Z"}' | & "$env:USERPROFILE\.claude\hooks\user_prompt_submit.exe"
```

#### 방법 2: Claude Code로 실제 테스트

아무 프로젝트 디렉터리에서:
```bash
claude
```

Claude Code에서 간단한 프롬프트를 입력:
```
Create a new file called test.txt with "Hello World"
```

웹 대시보드에서 스냅샷과 상호작용이 기록되었는지 확인하세요.

## 설정 파일 구조

### `~/.codetracker/config.json`

```json
{
  "version": "3.0",
  "server_url": "https://be.thinktrace.net",
  "ignore_patterns": [
    "*.pyc",
    "__pycache__",
    ".git",
    ".codetracker",
    ".claude",
    "node_modules",
    ".env",
    "*.log"
  ],
  "track_extensions": [
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".java", ".cpp", ".go", ".rs", ".md"
  ],
  "max_file_size": 1048576,
  "auto_snapshot": {
    "enabled": true,
    "min_interval_seconds": 30,
    "skip_patterns": ["^help", "^what is", "^explain"],
    "only_on_changes": true
  }
}
```

### `~/.codetracker/credentials.json`

```json
{
  "api_key": "your-api-key-here",
  "username": "your-username",
  "email": "your-email@example.com"
}
```

### `~/.claude/settings.json`

**macOS/Linux:**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/hooks/user_prompt_submit"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/hooks/stop"
          }
        ]
      }
    ]
  }
}
```

**Windows:**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "%USERPROFILE%\\.claude\\hooks\\user_prompt_submit.exe"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "%USERPROFILE%\\.claude\\hooks\\stop.exe"
          }
        ]
      }
    ]
  }
}
```

## 지원 플랫폼

| 운영체제 | 아키텍처 | 바이너리 파일명 |
|---------|---------|----------------|
| Linux | x64 (amd64) | `user_prompt_submit`, `stop` |
| Linux | ARM64 | `user_prompt_submit`, `stop` |
| macOS | x64 (Intel) | `user_prompt_submit`, `stop` |
| macOS | ARM64 (Apple Silicon) | `user_prompt_submit`, `stop` |
| Windows | x64 | `user_prompt_submit.exe`, `stop.exe` |

## 프로젝트 자동 감지

CodeTracker는 다음 방법으로 프로젝트를 자동 감지합니다:

1. **Git 저장소 해시**: 현재 디렉터리가 Git 저장소인 경우, 리모트 URL의 해시를 사용
2. **작업 디렉터리 경로**: Git이 아닌 경우, 현재 작업 디렉터리의 절대 경로를 사용

훅은 Claude Code가 실행될 때마다 현재 작업 디렉터리(cwd)를 감지하여 올바른 프로젝트로 자동 매핑합니다.

## 문제 해결

### 훅이 실행되지 않음

**문제:** Claude Code를 사용해도 스냅샷이 생성되지 않음

**해결 방법:**

1. **실행 권한 확인 (macOS/Linux):**
   ```bash
   ls -la ~/.claude/hooks/
   ```
   `-rwxr-xr-x`와 같이 실행 권한(x)이 있어야 합니다.

   권한이 없으면:
   ```bash
   chmod +x ~/.claude/hooks/user_prompt_submit
   chmod +x ~/.claude/hooks/stop
   ```

2. **바이너리 실행 테스트:**
   ```bash
   ~/.claude/hooks/user_prompt_submit --help
   ```
   실행되지 않으면 플랫폼이 맞는지 확인하세요.

3. **설정 파일 확인:**
   ```bash
   cat ~/.claude/settings.json
   ```
   `hooks` 섹션이 올바르게 설정되어 있는지 확인

4. **플랫폼 확인:**
   ```bash
   uname -m  # Linux/macOS
   ```
   - `x86_64` → amd64 바이너리 사용
   - `aarch64` 또는 `arm64` → arm64 바이너리 사용

### 인증 오류

**문제:** 스냅샷이 서버에 저장되지 않음

**해결 방법:**

1. **credentials.json 확인:**
   ```bash
   cat ~/.codetracker/credentials.json
   ```
   `api_key`가 올바른지 확인

2. **서버 연결 테스트:**
   ```bash
   curl -H "X-API-Key: YOUR_API_KEY" \
     https://be.thinktrace.net/api/health
   ```

### Windows에서 경로 문제

**문제:** Windows에서 훅을 찾을 수 없음

**해결 방법:**

`~/.claude/settings.json`에서 환경 변수 사용:
```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "%USERPROFILE%\\.claude\\hooks\\user_prompt_submit.exe"
      }]
    }]
  }
}
```

또는 절대 경로 사용:
```json
{
  "command": "C:\\Users\\username\\.claude\\hooks\\user_prompt_submit.exe"
}
```

### 프로젝트가 감지되지 않음

**문제:** 스냅샷이 잘못된 프로젝트로 저장됨

**해결 방법:**

1. **Git 저장소 확인:**
   ```bash
   git remote -v
   ```
   Git 저장소인 경우 리모트 URL이 올바른지 확인

2. **수동 프로젝트 매핑:**
   웹사이트에서 프로젝트를 생성할 때 Git URL이나 디렉터리 경로를 정확히 입력

## 업데이트 방법

새 버전이 출시되면 동일한 설치 명령어를 다시 실행하세요:

**자동 설치 스크립트 (권장):**
```bash
# macOS/Linux - 웹사이트에서 복사한 명령어 그대로 실행
curl -fsSL -H "X-API-Key: YOUR_API_KEY" \
  "https://your-server.com/api/install-script?projectHash=YOUR_PROJECT_HASH&os=mac" | bash
```

**또는 수동 다운로드:**
- 웹사이트에서 새 zip 파일 다운로드
- 동일한 방법으로 설치

**업데이트 시 자동 처리:**
- 기존 인증 정보 유지 (credentials.json)
- 기존 캐시 유지 (cache/)
- 기존 Claude 설정 보존 (settings.json은 병합만)
- config.json과 바이너리만 새 버전으로 교체

## 제거 방법

CodeTracker를 완전히 제거하려면:

**macOS/Linux:**
```bash
rm -rf ~/.codetracker
rm -rf ~/.claude
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.codetracker" -Recurse -Force
Remove-Item "$env:USERPROFILE\.claude" -Recurse -Force
```

## 도움이 필요하신가요?

- **웹사이트:** https://thinktrace.net
- **이메일:** contact@thinktrace.net

Happy Coding!
