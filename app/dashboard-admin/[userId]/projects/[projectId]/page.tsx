import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server';
import { getProjectInfo, getProjectInteractions } from '@/lib/supabase/queries';
import { AdminProjectDetailContent } from '@/components/dashboard/admin-project-detail-content';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

interface AdminProjectDetailPageProps {
  params: Promise<{
    userId: string;
    projectId: string;
  }>;
}

export default async function AdminProjectDetailPage({ params }: AdminProjectDetailPageProps) {
  const { userId, projectId: projectIdStr } = await params;
  const projectId = parseInt(projectIdStr);

  if (isNaN(projectId)) {
    notFound();
  }

  // 현재 로그인한 사용자 확인 (인증 체크)
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // 관리자 클라이언트로 대상 사용자 및 프로젝트 데이터 조회 (RLS 우회)
  const adminClient = getSupabaseAdminClient();

  // 사용자 데이터 가져오기
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    notFound();
  }

  // 프로젝트 정보 가져오기 (userId 검증 포함)
  const { data: projectInfo, error: projectError } = await adminClient
    .from('repositories')
    .select('id, repo_name, description, created_at, updated_at')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !projectInfo) {
    notFound();
  }

  // 프로젝트 AI Interactions 가져오기
  const { data: interactions } = await adminClient
    .from('ai_interactions')
    .select('*')
    .eq('repo_id', projectId)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      {/* 관리자 헤더 */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard-admin/${userId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                사용자 대시보드
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-sm">관리자 보기</span>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium">{userData.username}</p>
            <p className="text-xs text-muted-foreground">{userData.email}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AdminProjectDetailContent
          project={projectInfo}
          interactions={interactions || []}
          apiKey={userData.api_key}
          userId={userId}
        />
      </main>
    </div>
  );
}
