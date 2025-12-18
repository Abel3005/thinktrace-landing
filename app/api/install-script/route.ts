import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { SimpleOS } from '@/lib/platform';

const VALID_OS: SimpleOS[] = ['mac', 'linux', 'windows'];

function generateBashScript(
  baseUrl: string,
  projectHash: string,
  apiKey: string,
  os: SimpleOS
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

# 현재 디렉토리 확인
if [ ! -d ".git" ] && [ ! -f "package.json" ] && [ ! -f "Cargo.toml" ] && [ ! -f "go.mod" ]; then
  echo "⚠️  경고: 프로젝트 루트 디렉토리에서 실행하는 것을 권장합니다."
  read -p "계속하시겠습니까? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "설치가 취소되었습니다."
    exit 1
  fi
fi

# 임시 파일 생성
TMP_ZIP=$(mktemp /tmp/codetracker.XXXXXX.zip)

# 다운로드
echo "📥 파일 다운로드 중... (플랫폼: $PLATFORM)"
curl -fsSL -H "X-API-Key: ${apiKey}" "${baseUrl}/api/download-codetracker?projectHash=${projectHash}&platform=$PLATFORM" -o "$TMP_ZIP"

if [ ! -s "$TMP_ZIP" ]; then
  echo "❌ 다운로드 실패"
  rm -f "$TMP_ZIP"
  exit 1
fi

# 압축 해제
echo "📦 파일 압축 해제 중..."
unzip -o -q "$TMP_ZIP" -d .

# 정리
rm -f "$TMP_ZIP"

# 실행 권한 부여
echo "🔧 실행 권한 설정 중..."
chmod +x .claude/hooks/user_prompt_submit 2>/dev/null || true
chmod +x .claude/hooks/stop 2>/dev/null || true

echo ""
echo "✅ CodeTracker 설치 완료!"
echo ""
echo "📁 설치된 파일:"
echo "   .codetracker/config.json"
echo "   .codetracker/credentials.json"
echo "   .claude/settings.json"
echo "   .claude/hooks/user_prompt_submit"
echo "   .claude/hooks/stop"
echo ""
echo "💡 Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다."
`;
}

function generatePowerShellScript(
  baseUrl: string,
  projectHash: string,
  apiKey: string
): string {
  return `# CodeTracker 설치 스크립트 (Windows)
$ErrorActionPreference = "Stop"

Write-Host "🚀 CodeTracker 설치를 시작합니다..." -ForegroundColor Cyan

# 현재 디렉토리 확인
$projectIndicators = @(".git", "package.json", "Cargo.toml", "go.mod")
$isProjectRoot = $projectIndicators | Where-Object { Test-Path $_ }

if (-not $isProjectRoot) {
    Write-Host "⚠️  경고: 프로젝트 루트 디렉토리에서 실행하는 것을 권장합니다." -ForegroundColor Yellow
    $response = Read-Host "계속하시겠습니까? (y/N)"
    if ($response -notmatch "^[Yy]$") {
        Write-Host "설치가 취소되었습니다."
        exit 1
    }
}

# 임시 파일 생성
$TmpZip = [System.IO.Path]::GetTempFileName() + ".zip"

try {
    # 다운로드
    Write-Host "📥 파일 다운로드 중..." -ForegroundColor Cyan
    $url = "${baseUrl}/api/download-codetracker?projectHash=${projectHash}&platform=windows-amd64"
    $headers = @{ "X-API-Key" = "${apiKey}" }
    Invoke-WebRequest -Uri $url -OutFile $TmpZip -UseBasicParsing -Headers $headers

    if (-not (Test-Path $TmpZip) -or (Get-Item $TmpZip).Length -eq 0) {
        throw "다운로드 실패"
    }

    # 압축 해제
    Write-Host "📦 파일 압축 해제 중..." -ForegroundColor Cyan
    Expand-Archive -Path $TmpZip -DestinationPath . -Force

    Write-Host ""
    Write-Host "✅ CodeTracker 설치 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 설치된 파일:" -ForegroundColor Cyan
    Write-Host "   .codetracker\\config.json"
    Write-Host "   .codetracker\\credentials.json"
    Write-Host "   .claude\\settings.json"
    Write-Host "   .claude\\hooks\\user_prompt_submit.exe"
    Write-Host "   .claude\\hooks\\stop.exe"
    Write-Host ""
    Write-Host "💡 Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다." -ForegroundColor Yellow

} catch {
    Write-Host "❌ 설치 실패: $_" -ForegroundColor Red
    exit 1
} finally {
    # 정리
    if (Test-Path $TmpZip) {
        Remove-Item $TmpZip -Force
    }
}
`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectHash = searchParams.get('projectHash');
    const apiKey = request.headers.get('X-API-Key');
    const os = searchParams.get('os') as SimpleOS | null;

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

    // API 키로 사용자 인증 (RLS 우회)
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

    // 프로젝트 확인 (사용자 소유)
    const { data: project } = await supabase
      .from('repositories')
      .select('id, repo_hash')
      .eq('repo_hash', projectHash)
      .eq('user_id', userData.id)
      .single();

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
      ? generatePowerShellScript(baseUrl, projectHash, apiKey)
      : generateBashScript(baseUrl, projectHash, apiKey, os);

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
