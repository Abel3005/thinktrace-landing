import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Brain, FileSearch, BarChart3 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* 히어로 섹션 */}
        <section className="px-4 py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI 활용 역량 평가 및 개선 서비스
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl lg:text-2xl">
              당신은 AI를 어떻게 활용하고 있나요?<br/>
              <b>ThinkTrace</b>를 통해서 당신의 AI 활용 역량을 평가하고 개선해보세요.
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/signup">
                지금 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* 기능 섹션 */}
        <section className="px-4 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">핵심 기능</h2>
              <p className="text-lg text-muted-foreground">
                ThinkTrace는 AI 활용의 전 과정을 추적하고 분석합니다
              </p>
            </div>

            <div className="space-y-24">
              {/* 기능 1: 과정 중심 평가 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-6 order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Users className="h-4 w-4" />
                    과정 중심 평가
                  </div>
                  <h3 className="text-3xl font-bold">결과가 아닌 과정을 평가합니다</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    AI를 활용한 개발의 전체 과정을 추적하여 평가합니다.
                    단순히 완성된 코드가 아닌, 문제를 어떻게 정의하고 AI와 어떻게 협업했는지를 분석합니다.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">프롬프트 작성 패턴 분석</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">AI 피드백 반영 과정 추적</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">반복적 개선 사이클 평가</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <Card className="border-2 border-border/50 bg-card/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="/Process-oriented evaluation.png"
                          alt="과정 중심 평가 - AI 작업 상세 화면"
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 기능 2: 작업 분석 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="order-1">
                  <Card className="border-2 border-border/50 bg-card/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="/work-tree.png"
                          alt="작업 그룹별 상세 분석 - Work-tree 화면"
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6 order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <FileSearch className="h-4 w-4" />
                    작업 분석
                  </div>
                  <h3 className="text-3xl font-bold">작업 그룹별 상세 분석</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    프로젝트 내 작업들을 의미있는 그룹으로 분류하고, 각 작업의 목적과 과정을 분석합니다.
                    AI 기반 작업과 수동 작업을 구분하여 효율성을 평가합니다.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">작업 그룹 자동 분류</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">커밋별 상세 정보 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">AI 프롬프트 이력 추적</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 기능 3: 작업 기반 인사이트 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-6 order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-medium">
                    <BarChart3 className="h-4 w-4" />
                    작업 분석
                  </div>
                  <h3 className="text-3xl font-bold">작업 기반 인사이트 제공</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    사용자의 의도부터 최종 결과까지, 작업이 진행되는 전체 과정을 분석하여 인사이트를 제공합니다.
                    각 작업의 실행 흐름과 AI 협업 패턴을 통해 효율성을 평가하고 개선점을 제안합니다.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-secondary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-secondary-foreground" />
                      </div>
                      <span className="text-muted-foreground">사용자 의도와 최종 결과 비교 분석</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-secondary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-secondary-foreground" />
                      </div>
                      <span className="text-muted-foreground">작업 실행 흐름 시각화</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-secondary/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-secondary-foreground" />
                      </div>
                      <span className="text-muted-foreground">작업 흐름 평가 및 개선 제안</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <Card className="border-2 border-border/50 bg-card/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="/task-analysis.png"
                          alt="상세 통계 - 작업 분석 보고서"
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 기능 4: 사고 과정 추적 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="order-1">
                  <Card className="border-2 border-border/50 bg-card/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        <Image
                          src="/think-tracing.png"
                          alt="사고 과정 추적 - AI 활용 패턴 분석"
                          fill
                          className="object-cover object-top blur-sm"
                        />
                        <div className="absolute inset-0 bg-background/30" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6 order-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
                      <Brain className="h-4 w-4" />
                      사고 과정 추적
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold border border-amber-500/20">
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">AI 활용 패턴을 분석합니다</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    AI를 활용하는 사람의 사고과정을 추적하여 의미있는 패턴을 찾아냅니다.
                    문제 해결 방식, 프롬프트 작성 스타일, 코드 개선 전략 등을 종합적으로 분석합니다.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-accent/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-accent-foreground" />
                      </div>
                      <span className="text-muted-foreground">커밋 히스토리 기반 작업 흐름 추적</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-accent/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-accent-foreground" />
                      </div>
                      <span className="text-muted-foreground">AI 인터랙션 패턴 시각화</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 rounded-full bg-accent/20 p-1">
                        <div className="h-2 w-2 rounded-full bg-accent-foreground" />
                      </div>
                      <span className="text-muted-foreground">문제 해결 전략 평가</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="px-4 py-20 bg-gradient-to-t from-background to-muted/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              ThinkTrace와 함께 AI 활용 역량을 한 단계 업그레이드하세요
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ThinkTrace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
