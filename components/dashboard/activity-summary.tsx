import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderGit2, Sparkles, FileEdit } from "lucide-react"

interface ActivitySummaryProps {
  stats: {
    total_projects?: number
    total_interactions?: number
    total_files_changed?: number
  } | null
  projectCount: number
}

export function ActivitySummary({ stats, projectCount }: ActivitySummaryProps) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg">활동 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderGit2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">프로젝트</p>
            <p className="font-medium">{projectCount}개</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">AI 인터랙션</p>
            <p className="font-medium">{stats?.total_interactions ?? 0}회</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileEdit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">파일 변경</p>
            <p className="font-medium">{stats?.total_files_changed ?? 0}개</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
