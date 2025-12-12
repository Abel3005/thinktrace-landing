import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 스켈레톤 */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-9 w-20 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 사용자 정보 & API 키 카드 스켈레톤 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                      <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                      <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 로딩 인디케이터 */}
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">대시보드를 불러오는 중...</p>
          </div>
        </div>
      </main>
    </div>
  )
}
