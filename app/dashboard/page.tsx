import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UserInfo } from "@/components/dashboard/user-info"
import { ApiKeyCard } from "@/components/dashboard/api-key-card"
import { StatsCards } from "@/components/dashboard/stats-cards"

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <StatsCards stats={stats} />
          <div className="grid gap-6 md:grid-cols-2">
            <UserInfo user={userData} />
            <ApiKeyCard apiKey={userData?.api_key} />
          </div>
        </div>
      </main>
    </div>
  )
}
