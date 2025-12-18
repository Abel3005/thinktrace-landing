import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import path from 'path';
import type { Platform } from '@/lib/platform';

const VALID_PLATFORMS: Platform[] = [
  'darwin-amd64',
  'darwin-arm64',
  'linux-amd64',
  'linux-arm64',
  'windows-amd64',
];

function getSettingsForPlatform(platform: Platform): object {
  const isWindows = platform === 'windows-amd64';
  const ext = isWindows ? '.exe' : '';
  const pathSep = isWindows ? '\\\\' : '/';

  const hookPath = (name: string) =>
    isWindows
      ? `.claude${pathSep}hooks${pathSep}${name}${ext}`
      : `.claude/hooks/${name}`;

  return {
    hooks: {
      UserPromptSubmit: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: hookPath('user_prompt_submit')
            }
          ]
        }
      ],
      Stop: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: hookPath('stop')
            }
          ]
        }
      ]
    }
  };
}

// HEAD 요청 처리 (다운로드 전 유효성 확인용)
export async function HEAD(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform') as Platform | null;

    if (!projectId || !platform || !VALID_PLATFORMS.includes(platform)) {
      return new NextResponse(null, { status: 400 });
    }

    // 인증 확인
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    // 프로젝트 소유권 확인
    const { data: project } = await supabase
      .from('repositories')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const projectHash = searchParams.get('projectHash');
    const apiKey = request.headers.get('X-API-Key');
    const platform = searchParams.get('platform') as Platform | null;

    if (!projectId && !projectHash) {
      return NextResponse.json(
        { error: 'Project ID or Project Hash is required' },
        { status: 400 }
      );
    }

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required', validPlatforms: VALID_PLATFORMS },
        { status: 400 }
      );
    }

    let userId: string;
    let userData: { api_key: string; username: string; email: string } | null = null;
    let supabase;

    // API 키 인증 또는 세션 인증
    if (apiKey) {
      // API 키로 인증 (RLS 우회)
      supabase = getSupabaseAdminClient();
      const { data: userByApiKey } = await supabase
        .from('users')
        .select('id, api_key, username, email')
        .eq('api_key', apiKey)
        .single();

      if (!userByApiKey) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      userId = userByApiKey.id;
      userData = {
        api_key: userByApiKey.api_key,
        username: userByApiKey.username,
        email: userByApiKey.email,
      };
    } else {
      // 세션 인증
      supabase = await getSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      userId = user.id;

      // 사용자 데이터 조회
      const { data: userDataResult } = await supabase
        .from('users')
        .select('api_key, username, email')
        .eq('id', user.id)
        .single();

      if (!userDataResult) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      userData = userDataResult;
    }

    // 프로젝트 조회 (projectHash 또는 projectId로)
    let projectQuery = supabase
      .from('repositories')
      .select('id, repo_name, repo_hash')
      .eq('user_id', userId);

    if (projectHash) {
      projectQuery = projectQuery.eq('repo_hash', projectHash);
    } else if (projectId) {
      projectQuery = projectQuery.eq('id', projectId);
    }

    const { data: project } = await projectQuery.single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 새 zip 파일 생성
    const zip = new JSZip();

    // .codetracker 폴더 생성
    const codetrackerFolder = zip.folder('.codetracker');

    // config.json 읽기 (tmp 폴더에서)
    const configPath = path.join(process.cwd(), 'tmp', 'config.json');
    const configContent = await readFile(configPath, 'utf-8');
    codetrackerFolder?.file('config.json', configContent);

    // credentials.json 생성
    const credentials = {
      api_key: userData.api_key,
      username: userData.username,
      email: userData.email,
      current_project_hash: project.repo_hash,
    };
    codetrackerFolder?.file('credentials.json', JSON.stringify(credentials, null, 2));

    // .claude 폴더 생성
    const claudeFolder = zip.folder('.claude');
    const hooksFolder = claudeFolder?.folder('hooks');

    // 플랫폼별 settings.json 생성
    const settings = getSettingsForPlatform(platform);
    claudeFolder?.file('settings.json', JSON.stringify(settings, null, 2));

    // 플랫폼별 바이너리 추가
    const isWindows = platform === 'windows-amd64';
    const ext = isWindows ? '.exe' : '';
    const distDir = path.join(process.cwd(), 'dist', platform);

    try {
      // user_prompt_submit 바이너리
      const userPromptBinary = await readFile(path.join(distDir, `user_prompt_submit${ext}`));
      hooksFolder?.file(`user_prompt_submit${ext}`, userPromptBinary, {
        unixPermissions: isWindows ? undefined : '755',
      });

      // stop 바이너리
      const stopBinary = await readFile(path.join(distDir, `stop${ext}`));
      hooksFolder?.file(`stop${ext}`, stopBinary, {
        unixPermissions: isWindows ? undefined : '755',
      });
    } catch (binaryError) {
      console.error(`Error reading binaries for platform ${platform}:`, binaryError);
      return NextResponse.json(
        { error: `Binaries not found for platform: ${platform}` },
        { status: 500 }
      );
    }

    // zip 파일 생성
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
      platform: isWindows ? 'DOS' : 'UNIX',
    });

    // 파일명 생성 (브라우저 차단 방지를 위해 OS 이름 대신 약어 사용)
    const platformShort: Record<Platform, string> = {
      'darwin-amd64': 'mac_intel',
      'darwin-arm64': 'mac_m',
      'linux-amd64': 'linux',
      'linux-arm64': 'linux_arm',
      'windows-amd64': 'win',
    };
    const filename = `codetracker_${project.repo_name.replace(/[^a-zA-Z0-9]/g, '_')}_${platformShort[platform]}.zip`;

    // 응답 헤더 설정 및 zip 파일 반환
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        // 브라우저 의심 방지를 위한 추가 헤더
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating CodeTracker zip:', error);
    return NextResponse.json(
      { error: 'Failed to generate zip file' },
      { status: 500 }
    );
  }
}
