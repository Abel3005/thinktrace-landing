import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserInfo } from "@/components/dashboard/user-info"
import { ApiKeyCard } from "@/components/dashboard/api-key-card"
import { ContributionHeatmap } from "@/components/dashboard/contribution-heatmap"
import { ProjectList } from "@/components/dashboard/project-list"
import { getContributionData, getProjectStatistics } from "@/lib/supabase/queries"
import { transformContributionData } from "@/lib/date-utils"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  // Fetch user data from custom users table
  const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  // Fetch user statistics
  const { data: stats } = await supabase.from("user_statistics").select("*").eq("user_id", authUser.id).single()

  // Fetch contribution data (최근 365일)
  const { data: contributionData } = await getContributionData(authUser.id, supabase)

  // Fetch project statistics
  const { data: projectData } = await getProjectStatistics(authUser.id, supabase)

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
          <ProjectList projects={projects} />

          
        </div>
      </main>
    </div>
  )
}
