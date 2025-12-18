"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Terminal, Shield, CheckCircle2, AlertTriangle, Copy, Check, Settings, Trash2, Apple, Monitor } from "lucide-react"
import { useState } from "react"

function CodeBlock({ children, language = "bash" }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-background/80 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="복사"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </button>
    </div>
  )
}

function StepCard({ step, title, icon: Icon, children }: { step: number; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {step}
          </div>
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

export function GuideContent() {
  return (
    <>
      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="px-4 py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                홈으로
              </Link>
            </Button>
            <h1 className="text-4xl font-bold mb-4">CodeTracker 설치 가이드</h1>
            <p className="text-lg text-muted-foreground">
              간단한 명령어 하나로 CodeTracker를 설치할 수 있습니다.<br />
              아키텍처는 자동으로 감지됩니다.
            </p>
          </div>
        </section>

        {/* 설치 단계 */}
        <section className="px-4 py-12">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold">설치 단계</h2>

            <StepCard step={1} title="프로젝트 등록" icon={Settings}>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>CodeTracker 웹사이트에 로그인</li>
                <li>대시보드에서 새 프로젝트 생성</li>
                <li>프로젝트 목록에서 <strong>환경 설정</strong> 버튼 클릭</li>
              </ol>
            </StepCard>

            <StepCard step={2} title="운영체제 선택 및 명령어 복사" icon={Terminal}>
              <p className="text-muted-foreground mb-4">환경 설정 모달에서 운영체제를 선택하세요:</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Apple className="h-4 w-4" />
                  <span className="text-sm font-medium">Mac</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-medium">Windows</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Terminal className="h-4 w-4" />
                  <span className="text-sm font-medium">Linux</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">자동 아키텍처 감지</p>
                <p className="text-sm text-muted-foreground">
                  Intel/AMD(x64) 또는 ARM64(Apple Silicon 등)는 설치 스크립트가 자동으로 감지합니다.
                </p>
              </div>

              <p className="text-muted-foreground mt-4">명령어 예시 (Mac/Linux):</p>
              <CodeBlock>{`curl -fsSL -H "X-API-Key: YOUR_API_KEY" "https://thinktrace.net/api/install-script?projectHash=xxx&os=mac" | bash`}</CodeBlock>

              <p className="text-muted-foreground mt-4">명령어 예시 (Windows PowerShell):</p>
              <CodeBlock>{`$headers = @{ "X-API-Key" = "YOUR_API_KEY" }; iwr -useb "https://thinktrace.net/api/install-script?projectHash=xxx&os=windows" -Headers $headers | iex`}</CodeBlock>
            </StepCard>

            <StepCard step={3} title="프로젝트 루트에서 명령어 실행" icon={CheckCircle2}>
              <p className="text-muted-foreground">복사한 명령어를 프로젝트 루트 디렉토리에서 실행하세요:</p>
              <CodeBlock>{`cd your-project
# 복사한 명령어 붙여넣기`}</CodeBlock>

              <p className="text-muted-foreground mt-4">설치가 완료되면 다음과 같은 메시지가 표시됩니다:</p>
              <CodeBlock language="text">{`🚀 CodeTracker 설치를 시작합니다...
📋 감지된 아키텍처: ARM64
📥 파일 다운로드 중... (플랫폼: darwin-arm64)
📦 파일 압축 해제 중...
🔧 실행 권한 설정 중...

✅ CodeTracker 설치 완료!

📁 설치된 파일:
   .codetracker/config.json
   .codetracker/credentials.json
   .claude/settings.json
   .claude/hooks/user_prompt_submit
   .claude/hooks/stop

💡 Claude Code를 실행하면 자동으로 CodeTracker가 활성화됩니다.`}</CodeBlock>
            </StepCard>

            <StepCard step={4} title=".gitignore 업데이트" icon={Shield}>
              <p className="text-muted-foreground">프로젝트의 <code className="bg-muted px-1.5 py-0.5 rounded">.gitignore</code> 파일에 다음을 추가하세요:</p>
              <CodeBlock language="gitignore">{`# CodeTracker
.codetracker/credentials.json
.codetracker/cache/`}</CodeBlock>
              <div className="flex items-start gap-2 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500"><strong>주의:</strong> credentials.json은 절대 Git에 커밋하지 마세요!</p>
              </div>
            </StepCard>

            <StepCard step={5} title="설치 확인" icon={CheckCircle2}>
              <p className="text-muted-foreground">Claude Code를 실행하여 정상 동작을 확인하세요:</p>
              <CodeBlock>claude</CodeBlock>
              <p className="text-muted-foreground text-sm mt-2">간단한 프롬프트를 입력:</p>
              <CodeBlock>{`Create a new file called test.txt with "Hello World"`}</CodeBlock>
              <p className="text-muted-foreground text-sm mt-2">웹 대시보드에서 AI 인터랙션이 기록되었는지 확인하세요.</p>
            </StepCard>
          </div>
        </section>

        {/* CodeTracker 삭제 */}
        <section className="px-4 py-12 bg-muted/20">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-destructive" />
              CodeTracker 삭제
            </h2>
            <Card className="border-destructive/30 bg-card/50">
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  CodeTracker를 프로젝트에서 완전히 제거하려면 프로젝트 루트 디렉토리에서 아래 명령어를 실행하세요.
                </p>

                <div>
                  <p className="text-sm font-medium mb-2">Mac / Linux:</p>
                  <CodeBlock>rm -rf .claude .codetracker</CodeBlock>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Windows (PowerShell):</p>
                  <CodeBlock>{`Remove-Item -Recurse -Force .claude, .codetracker -ErrorAction SilentlyContinue`}</CodeBlock>
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    이 명령어는 모든 CodeTracker 설정과 캐시 파일을 삭제합니다.
                    대시보드의 프로젝트 데이터는 유지됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 지원 플랫폼 */}
        <section className="px-4 py-12">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">지원 플랫폼</h2>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold">운영체제</th>
                        <th className="text-left py-3 px-4 font-semibold">아키텍처</th>
                        <th className="text-left py-3 px-4 font-semibold">자동 감지</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Mac</td>
                        <td className="py-3 px-4">Intel (x64)</td>
                        <td className="py-3 px-4"><CheckCircle2 className="h-4 w-4 text-green-500" /></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Mac</td>
                        <td className="py-3 px-4">Apple Silicon (ARM64)</td>
                        <td className="py-3 px-4"><CheckCircle2 className="h-4 w-4 text-green-500" /></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Linux</td>
                        <td className="py-3 px-4">x64 (amd64)</td>
                        <td className="py-3 px-4"><CheckCircle2 className="h-4 w-4 text-green-500" /></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Linux</td>
                        <td className="py-3 px-4">ARM64</td>
                        <td className="py-3 px-4"><CheckCircle2 className="h-4 w-4 text-green-500" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Windows</td>
                        <td className="py-3 px-4">x64</td>
                        <td className="py-3 px-4"><CheckCircle2 className="h-4 w-4 text-green-500" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Mac과 Linux에서는 <code className="bg-muted px-1.5 py-0.5 rounded">uname -m</code> 명령으로 아키텍처를 자동 감지합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 문제 해결 */}
        <section className="px-4 py-12 bg-muted/20">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold">문제 해결</h2>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">훅이 실행되지 않음</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> Claude Code를 사용해도 인터랙션이 기록되지 않음</p>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">1. 실행 권한 확인 (Mac/Linux):</p>
                    <CodeBlock>ls -la .claude/hooks/</CodeBlock>
                    <p className="text-sm text-muted-foreground mt-2"><code>-rwxr-xr-x</code>와 같이 실행 권한(x)이 있어야 합니다.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">2. 바이너리 실행 테스트:</p>
                    <CodeBlock>./.claude/hooks/user_prompt_submit --help</CodeBlock>
                  </div>
                  <div>
                    <p className="font-medium mb-2">3. 재설치:</p>
                    <p className="text-sm text-muted-foreground">대시보드에서 환경 설정 &gt; 명령어 복사 후 다시 실행</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">인증 오류</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> 데이터가 서버에 저장되지 않음</p>
                <div>
                  <p className="font-medium mb-2">credentials.json 확인:</p>
                  <CodeBlock>cat .codetracker/credentials.json</CodeBlock>
                  <p className="text-sm text-muted-foreground mt-2"><code>api_key</code>와 <code>current_project_hash</code>가 있는지 확인</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">Windows Defender 차단</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> Windows에서 바이너리 실행이 차단됨</p>
                <div className="space-y-2">
                  <p className="font-medium">해결 방법:</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Windows Defender 경고창에서 "추가 정보" 클릭</li>
                    <li>"실행" 버튼 클릭</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 bg-gradient-to-t from-background to-muted/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">도움이 필요하신가요?</h2>
            <p className="text-muted-foreground mb-6">
              문의사항이 있으시면 언제든지 연락해 주세요.
            </p>
            <p className="text-muted-foreground">
              <strong>이메일:</strong>{" "}
              <a href="mailto:contact@thinktrace.net" className="text-primary hover:underline">
                contact@thinktrace.net
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ThinkTrace. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
