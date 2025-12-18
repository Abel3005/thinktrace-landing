import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserInfo } from "@/components/dashboard/user-info"
import { ApiKeyCard } from "@/components/dashboard/api-key-card"
import { ContributionHeatmap } from "@/components/dashboard/contribution-heatmap"
import { ProjectList } from "@/components/dashboard/project-list"
import { getContributionData, getProjectStatistics } from "@/lib/supabase/queries"
import { fetchUserStatistics } from "@/lib/api/client"
import { transformContributionData } from "@/lib/date-utils"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

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
  const [stats, { data: contributionData }, { data: projectData }] = await Promise.all([
    fetchUserStatistics(authUser.id, apiKey),
    getContributionData(authUser.id, undefined, 365, apiKey),
    getProjectStatistics(authUser.id, undefined, apiKey),
  ])

  // Transform and prepare data
  const contributions = contributionData ? transformContributionData(contributionData) : []
  const projects = projectData || []
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 사용자 정보 및 API 키 */}
          <div className="grid gap-6 md:grid-cols-2">
            <UserInfo user={userData} />
            <ApiKeyCard apiKey={userData?.api_key} />
          </div>

          {/* 활동 히트맵 (종합 정보 포함) */}
          <ContributionHeatmap data={contributions} stats={stats} />

          {/* 프로젝트 리스트 */}
          <ProjectList projects={projects} userId={authUser.id} apiKey={userData?.api_key || ''} />


        </div>
      </main>
    </div>
  )
}
