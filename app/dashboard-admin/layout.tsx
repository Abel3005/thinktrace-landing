import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccessDeniedModal } from "@/components/dashboard/access-denied-modal"

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

  // 사용자 API 키 가져오기
  const { data: userData } = await supabase
    .from("users")
    .select("api_key")
    .eq("id", user.id)
    .single()

  if (!userData?.api_key) {
    return <AccessDeniedModal />
  }

  // API 서버에서 관리자 여부 확인
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-admin`,
      {
        headers: {
          "X-API-Key": userData.api_key,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return <AccessDeniedModal />
    }

    const data = await response.json()

    if (!data.is_admin) {
      return <AccessDeniedModal />
    }
  } catch (error) {
    console.error("Failed to check admin status:", error)
    return <AccessDeniedModal />
  }

  return <>{children}</>
}
