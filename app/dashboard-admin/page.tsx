import { getSupabaseAdminClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, FolderGit2, GitCommit, Sparkles, FileEdit, ChevronRight } from "lucide-react"

interface User {
  id: string
  username: string
  email: string
  organization: string | null
  created_at: string
}

interface UserStats {
  user_id: string
  total_projects: number
  total_snapshots: number
  total_interactions: number
  total_files_changed: number
}

interface UserWithStats extends User {
  stats: UserStats | null
}

export default async function AdminDashboardPage() {
  // 관리자 클라이언트로 모든 사용자 데이터 조회 (RLS 우회)
  const adminClient = getSupabaseAdminClient()

  // 사용자와 통계 데이터를 병렬로 조회
  const [usersResponse, statsResponse] = await Promise.all([
    adminClient
      .from("users")
      .select("id, username, email, organization, created_at")
      .order("created_at", { ascending: false }),
    adminClient
      .from("user_statistics")
      .select("user_id, total_projects, total_snapshots, total_interactions, total_files_changed"),
  ])

  if (usersResponse.error) {
    console.error("Error fetching users:", usersResponse.error)
  }
  if (statsResponse.error) {
    console.error("Error fetching stats:", statsResponse.error)
  }

  const usersData = (usersResponse.data as User[]) || []
  const statsData = (statsResponse.data as UserStats[]) || []

  // 통계 데이터를 user_id 기준으로 맵핑
  const statsMap = new Map(statsData.map((s) => [s.user_id, s]))

  // 사용자와 통계 데이터 결합
  const users: UserWithStats[] = usersData.map((user) => ({
    ...user,
    stats: statsMap.get(user.id) || null,
  }))

  // 전체 통계 계산
  const totalStats = users.reduce(
    (acc, user) => {
      const stats = user.stats
      return {
        totalUsers: acc.totalUsers + 1,
        totalProjects: acc.totalProjects + (stats?.total_projects || 0),
        totalSnapshots: acc.totalSnapshots + (stats?.total_snapshots || 0),
        totalInteractions: acc.totalInteractions + (stats?.total_interactions || 0),
        totalFilesChanged: acc.totalFilesChanged + (stats?.total_files_changed || 0),
      }
    },
    {
      totalUsers: 0,
      totalProjects: 0,
      totalSnapshots: 0,
      totalInteractions: 0,
      totalFilesChanged: 0,
    }
  )

  const summaryItems = [
    {
      title: "총 사용자",
      value: totalStats.totalUsers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "총 프로젝트",
      value: totalStats.totalProjects,
      icon: FolderGit2,
      color: "text-blue-500",
    },
    {
      title: "총 커밋",
      value: totalStats.totalSnapshots,
      icon: GitCommit,
      color: "text-green-500",
    },
    {
      title: "총 AI 인터랙션",
      value: totalStats.totalInteractions,
      icon: Sparkles,
      color: "text-purple-500",
    },
    {
      title: "총 파일 변경",
      value: totalStats.totalFilesChanged,
      icon: FileEdit,
      color: "text-orange-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">전체 사용자 활동 요약</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 전체 통계 요약 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {summaryItems.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="border-border/50 bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.title}</p>
                        <p className="text-xl font-bold">{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 사용자 리스트 */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">사용자 활동 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사용자명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>조직</TableHead>
                      <TableHead className="text-right">프로젝트</TableHead>
                      <TableHead className="text-right">커밋</TableHead>
                      <TableHead className="text-right">AI 인터랙션</TableHead>
                      <TableHead className="text-right">파일 변경</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          등록된 사용자가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const stats = user.stats
                        const createdDate = new Date(user.created_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        return (
                          <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <Link href={`/dashboard-admin/${user.id}`} className="hover:underline">
                                {user.username}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {user.organization || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {(stats?.total_projects || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(stats?.total_snapshots || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(stats?.total_interactions || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(stats?.total_files_changed || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{createdDate}</TableCell>
                            <TableCell>
                              <Link href={`/dashboard-admin/${user.id}`}>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
