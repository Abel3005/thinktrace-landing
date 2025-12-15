import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UserInfo } from "@/components/dashboard/user-info"
import { AdminProjectList } from "@/components/dashboard/admin-project-list"
import { getProjectStatistics } from "@/lib/supabase/queries"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, FolderGit2, GitCommit, Sparkles, FileEdit } from "lucide-react"

interface AdminUserDetailPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = await params

  // 현재 로그인한 사용자 확인 (인증 체크)
  const supabase = await getSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  // 관리자 클라이언트로 대상 사용자 데이터 조회 (RLS 우회)
  const adminClient = getSupabaseAdminClient()

  // 모든 데이터를 병렬로 fetch
  const [
    { data: userData, error: userError },
    { data: stats },
    { data: projectData },
  ] = await Promise.all([
    adminClient.from("users").select("*").eq("id", userId).single(),
    adminClient.from("user_statistics").select("*").eq("user_id", userId).single(),
    getProjectStatistics(userId, adminClient),
  ])

  if (userError || !userData) {
    notFound()
  }

  const projects = projectData || []

  const statItems = [
    {
      title: "프로젝트",
      value: stats?.total_projects ?? 0,
      icon: FolderGit2,
      color: "text-primary",
    },
    {
      title: "커밋",
      value: stats?.total_snapshots ?? 0,
      icon: GitCommit,
      color: "text-blue-500",
    },
    {
      title: "AI 인터랙션",
      value: stats?.total_interactions ?? 0,
      icon: Sparkles,
      color: "text-purple-500",
    },
    {
      title: "파일 변경",
      value: stats?.total_files_changed ?? 0,
      icon: FileEdit,
      color: "text-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 관리자 헤더 */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard-admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
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
        <div className="grid gap-6">
          {/* 사용자 정보 및 활동 요약 */}
          <div className="grid gap-6 md:grid-cols-2">
            <UserInfo user={userData} />
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">활동 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* 프로젝트 리스트 (읽기 전용) */}
          <AdminProjectList projects={projects} userId={userId} />
        </div>
      </main>
    </div>
  )
}
