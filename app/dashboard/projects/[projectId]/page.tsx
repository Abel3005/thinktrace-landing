import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fetchProjectInfo, fetchProjectInteractions } from '@/lib/api/client';
import { ProjectDetailContent } from '@/components/dashboard/project-detail-content';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId: projectIdStr } = await params;
  const projectId = parseInt(projectIdStr);

  if (isNaN(projectId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  let authUser = null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    authUser = user;
  } catch (error) {
    console.error('Auth error:', error);
    redirect("/login");
  }

  if (!authUser) {
    redirect("/login");
  }

  // users 테이블에서 사용자 정보 조회
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!userData) {
    redirect("/login");
  }

  const apiKey = userData.api_key;

  // 프로젝트 정보 및 AI Interactions 조회
  const [projectInfo, interactions] = await Promise.all([
    fetchProjectInfo(projectId, authUser.id, apiKey),
    fetchProjectInteractions(projectId, authUser.id, apiKey),
  ]);

  if (!projectInfo) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        <ProjectDetailContent
          project={projectInfo}
          interactions={interactions || []}
          apiKey={apiKey}
        />
      </main>
    </div>
  );
}
