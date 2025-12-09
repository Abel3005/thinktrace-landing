import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, ArrowRight } from "lucide-react"

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
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">AI 기반 코드 추적 플랫폼</h1>
          <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
            ThinkTrace로 코드 변경 사항을 추적하고 관리하세요. 프로젝트의 모든 커밋과 파일 변경 내역을 한눈에 확인할 수
            있습니다.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              지금 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
