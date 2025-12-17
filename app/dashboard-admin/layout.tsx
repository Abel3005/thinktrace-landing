import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccessDeniedModal } from "@/components/dashboard/access-denied-modal"

const ADMIN_EMAIL = "contact@thinktrace.net"

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

  // 관리자 이메일 확인 - 권한 없으면 모달 표시
  if (user.email !== ADMIN_EMAIL) {
    return <AccessDeniedModal />
  }

  return <>{children}</>
}
