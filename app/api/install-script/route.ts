import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { lookupRepository } from '@/lib/api/client';
import type { SimpleOS } from '@/lib/platform';

const VALID_OS: SimpleOS[] = ['mac', 'linux', 'windows'];
type MergeMethod = 'python' | 'nodejs' | 'jq';

function getMergeScript(method: MergeMethod): string {
  if (method === 'python') {
    return `TMP_DIR_VAR="$TMP_DIR" python3 - <<'PYEOF'
import json
import os
from pathlib import Path

home = Path.home()
existing_settings_path = home / ".claude" / "settings.json"
new_settings_path = Path(os.environ["TMP_DIR_VAR"]) / ".claude" / "settings.json"

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

print("✓ settings.json 업데이트 완료")
PYEOF`;
  } else if (method === 'nodejs') {
    return `TMP_DIR_VAR="$TMP_DIR" node - <<'NODEOF'
const fs = require('fs');
const path = require('path');
const os = require('os');

const home = os.homedir();
const existingSettingsPath = path.join(home, '.claude', 'settings.json');
const newSettingsPath = path.join(process.env.TMP_DIR_VAR, '.claude', 'settings.json');

const newSettings = JSON.parse(fs.readFileSync(newSettingsPath, 'utf-8'));

let finalSettings;
if (fs.existsSync(existingSettingsPath)) {
    const existingSettings = JSON.parse(fs.readFileSync(existingSettingsPath, 'utf-8'));
    if (!existingSettings.hooks) {
        existingSettings.hooks = {};
    }
    for (const [hookType, hookConfigs] of Object.entries(newSettings.hooks || {})) {
        existingSettings.hooks[hookType] = hookConfigs;
    }
    finalSettings = existingSettings;
} else {
    finalSettings = newSettings;
}

fs.writeFileSync(existingSettingsPath, JSON.stringify(finalSettings, null, 2));
console.log('✓ settings.json 업데이트 완료');
NODEOF`;
  } else if (method === 'jq') {
    return `EXISTING_SETTINGS="$HOME/.claude/settings.json"
NEW_SETTINGS="$TMP_DIR/.claude/settings.json"

if [ -f "$EXISTING_SETTINGS" ]; then
    # 기존 설정과 병합
    jq -s '.[0] * .[1]' "$EXISTING_SETTINGS" "$NEW_SETTINGS" > "$EXISTING_SETTINGS.tmp"
    mv "$EXISTING_SETTINGS.tmp" "$EXISTING_SETTINGS"
else
    # 새 설정 복사
    cp "$NEW_SETTINGS" "$EXISTING_SETTINGS"
fi

echo "✓ settings.json 업데이트 완료"`;
  }
  return '';
}

function generateBashScript(
  baseUrl: string,
  projectHash: string,
  apiKey: string,
  os: SimpleOS,
  mergeMethod: MergeMethod = 'nodejs'
): string {
  // os가 'mac'이면 darwin, 'linux'면 linux
  const osPrefix = os === 'mac' ? 'darwin' : 'linux';

  return `#!/bin/bash
set -e

# CodeTracker 설치 스크립트
# OS: ${os === 'mac' ? 'macOS' : 'Linux'}

echo "🚀 CodeTracker 설치를 시작합니다..."

# 아키텍처 자동 감지
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64)
    PLATFORM="${osPrefix}-amd64"
    echo "📋 감지된 아키텍처: x86_64 (Intel/AMD)"
    ;;
  arm64|aarch64)
    PLATFORM="${osPrefix}-arm64"
    echo "📋 감지된 아키텍처: ARM64"
    ;;
  *)
    echo "❌ 지원되지 않는 아키텍처: $ARCH"
    exit 1
    ;;
esac

# 임시 파일 생성
TMP_ZIP=$(mktemp /tmp/codetracker.XXXXXX.zip)
TMP_DIR=$(mktemp -d /tmp/codetracker.XXXXXX)

# 다운로드
echo "📥 파일 다운로드 중... (플랫폼: $PLATFORM)"
curl -fsSL -H "X-API-Key: ${apiKey}" "${baseUrl}/api/download-codetracker?projectHash=${projectHash}&platform=$PLATFORM" -o "$TMP_ZIP"

if [ ! -s "$TMP_ZIP" ]; then
  echo "❌ 다운로드 실패"
  rm -f "$TMP_ZIP"
  exit 1
fi

# 임시 디렉터리에 압축 해제
echo "📦 파일 압축 해제 중..."
unzip -o -q "$TMP_ZIP" -d "$TMP_DIR"

# 홈 디렉터리로 복사
echo "📂 파일을 홈 디렉터리로 복사 중..."
mkdir -p "$HOME/.codetracker"
mkdir -p "$HOME/.claude/hooks"

# 기존 설치 확인
if [ -f "$HOME/.codetracker/credentials.json" ]; then
    echo "🔄 기존 설치 감지 - 업데이트 모드"
    BACKUP_CREDENTIALS=$(mktemp)
    cp "$HOME/.codetracker/credentials.json" "$BACKUP_CREDENTIALS"
    UPDATE_MODE=true
else
    echo "🆕 새로운 설치"
    UPDATE_MODE=false
fi

# .codetracker 파일 복사 (config.json만 덮어쓰기)
cp "$TMP_DIR/.codetracker/config.json" "$HOME/.codetracker/config.json"

# credentials.json 처리
if [ "$UPDATE_MODE" = true ]; then
    # 기존 credentials.json 복원
    cp "$BACKUP_CREDENTIALS" "$HOME/.codetracker/credentials.json"
    rm "$BACKUP_CREDENTIALS"
    echo "✓ 기존 인증 정보 유지됨"
else
    # 새 credentials.json 복사
    cp "$TMP_DIR/.codetracker/credentials.json" "$HOME/.codetracker/credentials.json"
fi

# cache 폴더는 유지 (복사하지 않음)
mkdir -p "$HOME/.codetracker/cache"

# .claude hooks 복사 (바이너리 업데이트)
cp -r "$TMP_DIR/.claude/hooks/"* "$HOME/.claude/hooks/" 2>/dev/null || true

# settings.json 병합
echo "⚙️  settings.json 병합 중..."
${getMergeScript(mergeMethod)}

# 정리
rm -rf "$TMP_ZIP" "$TMP_DIR"

# 실행 권한 부여
echo "🔧 실행 권한 설정 중..."
chmod +x "$HOME/.claude/hooks/user_prompt_submit" 2>/dev/null || true
chmod +x "$HOME/.claude/hooks/stop" 2>/dev/null || true

echo ""
echo "✅ CodeTracker 설치 완료!"
echo ""
echo "📁 설치된 위치:"
echo "   $HOME/.codetracker/config.json"
echo "   $HOME/.codetracker/credentials.json"
echo "   $HOME/.claude/settings.json"
echo "   $HOME/.claude/hooks/user_prompt_submit"
echo "   $HOME/.claude/hooks/stop"
echo ""
echo "💡 이제 모든 프로젝트에서 Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다."
echo "💡 프로젝트는 작업 디렉터리를 기반으로 자동 감지됩니다."
`;
}

function getPowerShellMergeScript(method: MergeMethod): string {
  if (method === 'python') {
    return `# Merge settings.json using Python
Write-Host "Merging settings.json using Python..." -ForegroundColor Cyan
$env:TMP_DIR_VAR = $TmpDir
python - @"
import json
import os
from pathlib import Path

tmp_dir = Path(os.environ['TMP_DIR_VAR'])
home = Path.home()
existing_settings_path = home / ".claude" / "settings.json"
new_settings_path = tmp_dir / ".claude" / "settings.json"

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

print("settings.json updated")
"@`;
  } else if (method === 'nodejs') {
    return `# Merge settings.json using Node.js
Write-Host "Merging settings.json using Node.js..." -ForegroundColor Cyan
$env:TMP_DIR_VAR = $TmpDir
node - @"
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = process.env.TMP_DIR_VAR;
const home = os.homedir();
const existingSettingsPath = path.join(home, '.claude', 'settings.json');
const newSettingsPath = path.join(tmpDir, '.claude', 'settings.json');

const newSettings = JSON.parse(fs.readFileSync(newSettingsPath, 'utf-8'));

let finalSettings;
if (fs.existsSync(existingSettingsPath)) {
    const existingSettings = JSON.parse(fs.readFileSync(existingSettingsPath, 'utf-8'));
    if (!existingSettings.hooks) {
        existingSettings.hooks = {};
    }
    for (const [hookType, hookConfigs] of Object.entries(newSettings.hooks || {})) {
        existingSettings.hooks[hookType] = hookConfigs;
    }
    finalSettings = existingSettings;
} else {
    finalSettings = newSettings;
}

fs.writeFileSync(existingSettingsPath, JSON.stringify(finalSettings, null, 2));
console.log('settings.json updated');
"@`;
  } else if (method === 'jq') {
    return `# Merge settings.json using jq
Write-Host "Merging settings.json using jq..." -ForegroundColor Cyan
$existingSettingsPath = Join-Path $env:USERPROFILE ".claude\\settings.json"
$newSettingsPath = Join-Path $TmpDir ".claude\\settings.json"

if (Test-Path $existingSettingsPath) {
    # Merge using jq
    $tmpFile = "$existingSettingsPath.tmp"
    jq -s '.[0] * .[1]' $existingSettingsPath $newSettingsPath | Out-File -FilePath $tmpFile -Encoding UTF8
    Move-Item -Path $tmpFile -Destination $existingSettingsPath -Force
} else {
    Copy-Item -Path $newSettingsPath -Destination $existingSettingsPath
}
Write-Host "settings.json updated" -ForegroundColor Green`;
  } else {
    // Default: PowerShell native
    return `# Merge settings.json using PowerShell
Write-Host "Merging settings.json..." -ForegroundColor Cyan
$newSettingsPath = Join-Path $TmpDir ".claude\\settings.json"
$existingSettingsPath = Join-Path $claudeDir "settings.json"

$newSettings = Get-Content $newSettingsPath -Raw | ConvertFrom-Json

if (Test-Path $existingSettingsPath) {
    $existingSettings = Get-Content $existingSettingsPath -Raw | ConvertFrom-Json

    # Merge hooks
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

# Save
$finalSettings | ConvertTo-Json -Depth 10 | Set-Content $existingSettingsPath -Encoding UTF8

Write-Host "settings.json updated" -ForegroundColor Green`;
  }
}

function generatePowerShellScript(
  baseUrl: string,
  projectHash: string,
  apiKey: string,
  mergeMethod: MergeMethod = 'nodejs'
): string {
  return `# CodeTracker Installation Script (Windows)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting CodeTracker installation..." -ForegroundColor Cyan

# Create temporary files
$TmpZip = [System.IO.Path]::GetTempFileName() + ".zip"
$TmpDir = Join-Path $env:TEMP "codetracker_$(Get-Random)"
New-Item -ItemType Directory -Path $TmpDir | Out-Null

# Download using curl
Write-Host "Downloading files..." -ForegroundColor Cyan
$url = "${baseUrl}/api/download-codetracker?projectHash=${projectHash}&platform=windows-amd64"
curl.exe -fsSL -H "X-API-Key: ${apiKey}" $url -o $TmpZip

if (-not (Test-Path $TmpZip) -or (Get-Item $TmpZip).Length -eq 0) {
    throw "Download failed"
}

# Extract to temporary directory
Write-Host "Extracting files..." -ForegroundColor Cyan
Expand-Archive -Path $TmpZip -DestinationPath $TmpDir -Force

# Copy to home directory
Write-Host "Copying files to home directory..." -ForegroundColor Cyan
$codetrackerDir = Join-Path $env:USERPROFILE ".codetracker"
$claudeDir = Join-Path $env:USERPROFILE ".claude"

New-Item -ItemType Directory -Path $codetrackerDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $claudeDir "hooks") -Force | Out-Null

# Check for existing installation
$credentialsPath = Join-Path $codetrackerDir "credentials.json"
if (Test-Path $credentialsPath) {
    Write-Host "Existing installation detected - Update mode" -ForegroundColor Yellow
    $backupCredentials = [System.IO.Path]::GetTempFileName()
    Copy-Item -Path $credentialsPath -Destination $backupCredentials
    $updateMode = $true
} else {
    Write-Host "New installation" -ForegroundColor Green
    $updateMode = $false
}

# Copy .codetracker config.json only
$configSource = Join-Path $TmpDir ".codetracker\\config.json"
$configDest = Join-Path $codetrackerDir "config.json"
Copy-Item -Path $configSource -Destination $configDest -Force

# Handle credentials.json
if ($updateMode) {
    # Restore existing credentials
    Copy-Item -Path $backupCredentials -Destination $credentialsPath -Force
    Remove-Item $backupCredentials -Force
    Write-Host "Existing credentials preserved" -ForegroundColor Green
} else {
    # Copy new credentials
    $newCredentialsSource = Join-Path $TmpDir ".codetracker\\credentials.json"
    Copy-Item -Path $newCredentialsSource -Destination $credentialsPath -Force
}

# Ensure cache directory exists (don't overwrite)
$cacheDir = Join-Path $codetrackerDir "cache"
New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null

# Copy .claude hooks (update binaries)
$hooksSource = Join-Path $TmpDir ".claude\\hooks"
$hooksDest = Join-Path $claudeDir "hooks"
Copy-Item -Path "$hooksSource\\*" -Destination $hooksDest -Recurse -Force

${getPowerShellMergeScript(mergeMethod)}

# Cleanup
Remove-Item $TmpZip -Force
Remove-Item $TmpDir -Recurse -Force

Write-Host ""
Write-Host "CodeTracker installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Installed files:" -ForegroundColor Cyan
Write-Host "   $env:USERPROFILE\\.codetracker\\config.json"
Write-Host "   $env:USERPROFILE\\.codetracker\\credentials.json"
Write-Host "   $env:USERPROFILE\\.claude\\settings.json"
Write-Host "   $env:USERPROFILE\\.claude\\hooks\\user_prompt_submit.exe"
Write-Host "   $env:USERPROFILE\\.claude\\hooks\\stop.exe"
Write-Host ""
Write-Host "CodeTracker will be activated automatically when you run Claude Code in any project." -ForegroundColor Yellow
Write-Host "Projects will be automatically detected based on your working directory." -ForegroundColor Yellow
`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectHash = searchParams.get('projectHash');
    const apiKey = request.headers.get('X-API-Key');
    const os = searchParams.get('os') as SimpleOS | null;
    const mergeMethod = (searchParams.get('mergeMethod') as MergeMethod) || 'nodejs';

    if (!projectHash) {
      return NextResponse.json(
        { error: 'Project hash is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required (X-API-Key header)' },
        { status: 400 }
      );
    }

    if (!os || !VALID_OS.includes(os)) {
      return NextResponse.json(
        { error: 'Valid OS is required', validOS: VALID_OS },
        { status: 400 }
      );
    }

    // API 키로 사용자 인증 (users 테이블은 Supabase에서 조회)
    const supabase = getSupabaseAdminClient();
    const { data: userData } = await supabase
      .from('users')
      .select('id, api_key')
      .eq('api_key', apiKey)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // 프로젝트 확인 (External API 사용)
    const project = await lookupRepository(userData.id, projectHash, undefined, apiKey);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Base URL 생성
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // OS에 따른 스크립트 생성
    const isWindows = os === 'windows';
    const script = isWindows
      ? generatePowerShellScript(baseUrl, projectHash, apiKey, mergeMethod)
      : generateBashScript(baseUrl, projectHash, apiKey, os, mergeMethod);

    const contentType = isWindows ? 'text/plain; charset=utf-8' : 'text/x-shellscript; charset=utf-8';

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating install script:', error);
    return NextResponse.json(
      { error: 'Failed to generate install script' },
      { status: 500 }
    );
  }
}
