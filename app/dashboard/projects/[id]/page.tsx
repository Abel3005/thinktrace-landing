import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getProjectInfo, getProjectCommits } from '@/lib/supabase/queries';
import { DashboardHeader } from '@/components/dashboard/header';
import { ProjectDetailContent } from '@/components/dashboard/project-detail-content';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = parseInt(id);

  if (isNaN(projectId)) {
    redirect('/dashboard');
  }

  const supabase = await getSupabaseServerClient();

  // 인증 확인
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect('/login');
  }

  // 사용자 데이터 가져오기
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData) {
    redirect('/login');
  }

  // 프로젝트 정보 가져오기
  const { data: projectInfo, error: projectError } = await getProjectInfo(
    projectId,
    authUser.id,
    supabase
  );

  if (projectError || !projectInfo) {
    redirect('/dashboard');
  }

  // 프로젝트 커밋 가져오기
  const { data: commits, error: commitsError } = await getProjectCommits(
    projectId,
    authUser.id,
    supabase
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        <ProjectDetailContent
          project={projectInfo}
          commits={commits || []}
        />
      </main>
    </div>
  );
}
