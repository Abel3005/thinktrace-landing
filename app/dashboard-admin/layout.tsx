import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccessDeniedModal } from "@/components/dashboard/access-denied-modal"
import { AdminHeader } from "@/components/dashboard/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인 확인
  if (!user) {
    redirect("/login")
  }

  // 사용자 정보 가져오기 (is_admin 필드 포함)
  const { data: userData } = await supabase
    .from("users")
    .select("api_key, username, email, is_admin")
    .eq("id", user.id)
    .single()

  if (!userData?.api_key) {
    return <AccessDeniedModal />
  }

  // 관리자 여부 확인 (Supabase에서 직접 확인)
  if (!userData.is_admin) {
    return <AccessDeniedModal />
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        user={{
          username: userData.username,
          email: userData.email,
        }}
      />
      {children}
    </div>
  )
}
