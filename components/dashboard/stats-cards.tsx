import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderGit2, GitCommit, Sparkles, FileEdit } from "lucide-react"

interface StatsCardsProps {
  stats: {
    total_projects: number
    total_snapshots: number
    total_interactions: number
    total_files_changed: number
  } | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statItems = [
    {
      title: "프로젝트",
      value: stats?.total_projects ?? 0,
      icon: FolderGit2,
      description: "총 프로젝트 수",
    },
    {
      title: "커밋",
      value: stats?.total_snapshots ?? 0,
      icon: GitCommit,
      description: "총 커밋 수",
    },
    {
      title: "AI 인터랙션",
      value: stats?.total_interactions ?? 0,
      icon: Sparkles,
      description: "AI 기반 변경",
    },
    {
      title: "파일 변경",
      value: stats?.total_files_changed ?? 0,
      icon: FileEdit,
      description: "수정된 파일 수",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
