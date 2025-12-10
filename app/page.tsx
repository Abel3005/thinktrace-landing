import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, ArrowRight, Users, GitBranch, Brain } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ThinkTrace</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">시작하기</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-16">
        <div className="max-w-3xl text-center mb-16">
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">AI 활용 역량 평가 및 개선 서비스</h1>
          <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
            당신은 AI를 어떻게 활용하고 있나요?<br/><b>ThinkTrace</b>를 통해서 당신의 AI 활용 역량을 평가하고 개선해보세요.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              지금 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">과정 중심 평가</h3>
              <p className="text-sm text-muted-foreground">
              결과물로만 평가하는 것이 아닌 AI를 활용한 전체 과정을 평가합니다.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">사고 과정 평가</h3>
              <p className="text-sm text-muted-foreground">
              AI를 활용하는 사람의 사고과정을 추적하여 의미있는 패턴을 분석해줍니다.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">직군별 맞춤 평가</h3>
              <p className="text-sm text-muted-foreground">
              각 직군에 맞게 AI 활용 역량을 평가해줍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
