import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { lookupRepository } from '@/lib/api/client';
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
  return `# CodeTracker Installation Script (Windows)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting CodeTracker installation..." -ForegroundColor Cyan

# Check current directory
$projectIndicators = @(".git", "package.json", "Cargo.toml", "go.mod")
$isProjectRoot = $projectIndicators | Where-Object { Test-Path $_ }

if (-not $isProjectRoot) {
    Write-Host "Warning: It is recommended to run this in your project root directory." -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue? (y/N)"
    if ($response -notmatch "^[Yy]$") {
        Write-Host "Installation cancelled."
        exit 1
    }
}

# Create temporary file
$TmpZip = [System.IO.Path]::GetTempFileName() + ".zip"

try {
    # Download using curl
    Write-Host "Downloading files..." -ForegroundColor Cyan
    $url = "${baseUrl}/api/download-codetracker?projectHash=${projectHash}&platform=windows-amd64"
    curl.exe -fsSL -H "X-API-Key: ${apiKey}" $url -o $TmpZip

    if (-not (Test-Path $TmpZip) -or (Get-Item $TmpZip).Length -eq 0) {
        throw "Download failed"
    }

    # Extract archive
    Write-Host "Extracting files..." -ForegroundColor Cyan
    Expand-Archive -Path $TmpZip -DestinationPath . -Force

    Write-Host ""
    Write-Host "CodeTracker installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installed files:" -ForegroundColor Cyan
    Write-Host "   .codetracker\\config.json"
    Write-Host "   .codetracker\\credentials.json"
    Write-Host "   .claude\\settings.json"
    Write-Host "   .claude\\hooks\\user_prompt_submit.exe"
    Write-Host "   .claude\\hooks\\stop.exe"
    Write-Host ""
    Write-Host "CodeTracker will be activated automatically when you run Claude Code." -ForegroundColor Yellow

} catch {
    Write-Host "Installation failed: \$_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
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
