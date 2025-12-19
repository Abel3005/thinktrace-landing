import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserInfo } from "@/components/dashboard/user-info"
import { ActivitySummary } from "@/components/dashboard/activity-summary"
import { ProjectList } from "@/components/dashboard/project-list"
import { getProjectStatistics } from "@/lib/supabase/queries"
import { fetchUserStatistics } from "@/lib/api/client"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  let authUser = null
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    authUser = user
  } catch (error) {
    // Refresh token 만료 또는 유효하지 않은 세션
    console.error('Auth error:', error)
    redirect("/login")
  }

  if (!authUser) {
    redirect("/login")
  }

  // users 테이블은 Supabase에서 조회 (먼저 조회하여 api_key 획득)
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  const apiKey = userData?.api_key

  // 나머지 데이터는 External API에서 병렬로 fetch
  const [stats, { data: projectData }] = await Promise.all([
    fetchUserStatistics(authUser.id, apiKey),
    getProjectStatistics(authUser.id, undefined, apiKey),
  ])

  const projects = projectData || []

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 사용자 정보 및 활동 요약 */}
          <div className="grid gap-6 md:grid-cols-2">
            <UserInfo user={userData} />
            <ActivitySummary stats={stats} projectCount={projects.length} />
          </div>

          {/* 프로젝트 리스트 */}
          <ProjectList projects={projects} userId={authUser.id} apiKey={userData?.api_key || ''} />
        </div>
      </main>
    </div>
  )
}
