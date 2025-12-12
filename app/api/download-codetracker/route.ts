import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // 인증 확인
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 사용자 데이터 및 API 키 조회
    const { data: userData } = await supabase
      .from('users')
      .select('api_key, username, email')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 프로젝트 조회 (사용자 소유 확인)
    const { data: project } = await supabase
      .from('repositories')
      .select('id, repo_name, repo_hash')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 원본 zip 파일 읽기
    const zipPath = path.join(process.cwd(), 'tmp', 'codetracker_install.zip');
    const zipBuffer = await readFile(zipPath);

    // JSZip으로 zip 파일 로드
    const zip = await JSZip.loadAsync(zipBuffer);

    // credentials.json 파일 읽기 및 수정
    const credentialsFile = zip.file('.codetracker/credentials.json');

    if (!credentialsFile) {
      return NextResponse.json(
        { error: 'credentials.json not found in zip file' },
        { status: 500 }
      );
    }

    const credentialsContent = await credentialsFile.async('string');
    const credentials = JSON.parse(credentialsContent);

    // API 키 및 프로젝트 해시 업데이트
    credentials.api_key = userData.api_key;
    credentials.username = userData.username;
    credentials.email = userData.email;
    // 프로젝트 ID를 UUID 형식으로 변환 (또는 그대로 사용)
    // TODO: 나중에 repositories 테이블에 project_hash 필드 추가
    credentials.current_project_hash = project.repo_hash;

    // 수정된 credentials.json으로 교체
    zip.file('.codetracker/credentials.json', JSON.stringify(credentials, null, 2));

    // 새로운 zip 파일 생성
    const modifiedZipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // 파일명 생성
    const filename = `codetracker_${project.repo_name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;

    // 응답 헤더 설정 및 zip 파일 반환
    return new NextResponse(modifiedZipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': modifiedZipBuffer.length.toString(),
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
