import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccessDeniedModal } from "@/components/dashboard/access-denied-modal"
import { ServerErrorModal } from "@/components/dashboard/server-error-modal"
import { AdminHeader } from "@/components/dashboard/admin-header"

// 재시도 로직이 포함된 관리자 확인 함수
async function checkAdminWithRetry(
  apiKey: string,
  maxRetries: number = 3
): Promise<{ isAdmin: boolean; isServerError: boolean }> {
  const delays = [0, 500, 1000] // 첫 시도는 즉시, 이후 500ms, 1000ms 대기

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-admin`,
        {
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      )

      if (!response.ok) {
        // 4xx 에러는 권한 문제이므로 재시도하지 않음
        if (response.status >= 400 && response.status < 500) {
          return { isAdmin: false, isServerError: false }
        }
        // 5xx 에러는 재시도
        continue
      }

      const data = await response.json()
      return { isAdmin: data.is_admin === true, isServerError: false }
    } catch (error) {
      console.error(`Admin check attempt ${attempt + 1} failed:`, error)
      // 마지막 시도가 아니면 계속 재시도
      if (attempt < maxRetries - 1) {
        continue
      }
    }
  }

  // 모든 재시도 실패
  return { isAdmin: false, isServerError: true }
}

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

  // 사용자 정보 가져오기
  const { data: userData } = await supabase
    .from("users")
    .select("api_key, username, email")
    .eq("id", user.id)
    .single()

  if (!userData?.api_key) {
    return <AccessDeniedModal />
  }

  // API 서버에서 관리자 여부 확인 (재시도 로직 포함)
  const { isAdmin, isServerError } = await checkAdminWithRetry(userData.api_key)

  if (isServerError) {
    return <ServerErrorModal />
  }

  if (!isAdmin) {
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
