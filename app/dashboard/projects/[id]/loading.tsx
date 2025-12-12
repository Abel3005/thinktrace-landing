import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProjectDetailLoading() {
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
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 space-y-2">
              <div className="h-9 w-48 bg-muted/50 rounded animate-pulse" />
              <div className="h-5 w-96 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>

          {/* 통계 카드 스켈레톤 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                      <div className="h-8 w-12 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 로딩 인디케이터 */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="h-6 w-40 bg-muted/50 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">프로젝트 정보를 불러오는 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
