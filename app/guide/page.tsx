"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, ArrowLeft, Download, Terminal, FolderOpen, Shield, CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react"
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

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">ThinkTrace</Link>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/guide">설치 가이드</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">시작하기</Link>
            </Button>
          </nav>
        </div>
      </header>

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
              CodeTracker를 프로젝트에 설치하는 방법을 안내합니다.<br />
            </p>
          </div>
        </section>

        {/* 설치 단계 */}
        <section className="px-4 py-12">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold">설치 단계</h2>

            <StepCard step={1} title="웹사이트에서 사용자 등록" icon={Download}>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>CodeTracker 웹사이트에 접속</li>
                <li>계정 생성 및 로그인</li>
                <li>새 프로젝트 생성</li>
                <li><strong>플랫폼 선택 후</strong> 설정 파일 다운로드 (zip 파일)</li>
              </ol>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">다운로드한 파일에는 다음이 포함됩니다:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">.codetracker/config.json</code> - 프로젝트 설정</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">.codetracker/credentials.json</code> - API 키 및 인증 정보</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">.claude/hooks/user_prompt_submit</code> - 프롬프트 전 훅 (바이너리)</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">.claude/hooks/stop</code> - 프롬프트 후 훅 (바이너리)</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded">.claude/settings.json</code> - Claude Code 훅 설정</li>
                </ul>
              </div>
            </StepCard>

            <StepCard step={2} title="프로젝트에 파일 복사" icon={FolderOpen}>
              <p className="text-muted-foreground">다운로드한 zip 파일을 프로젝트 루트에 압축 해제:</p>
              <CodeBlock>{`cd your-project
unzip codetracker-setup.zip`}</CodeBlock>

              <p className="text-muted-foreground mt-4">압축 해제 후 디렉터리 구조:</p>
              <CodeBlock language="text">{`your-project/
├── .codetracker/
│   ├── config.json          # 프로젝트 설정
│   ├── credentials.json     # API 키 (보안 유지!)
│   └── cache/               # 자동 생성됨
├── .claude/
│   ├── settings.json        # 훅 설정
│   └── hooks/
│       ├── user_prompt_submit   # Go 바이너리 (Unix/macOS)
│       ├── user_prompt_submit.exe  # Go 바이너리 (Windows)
│       ├── stop                 # Go 바이너리 (Unix/macOS)
│       └── stop.exe             # Go 바이너리 (Windows)
└── ... (your source files)`}</CodeBlock>
            </StepCard>

            <StepCard step={3} title="실행 권한 설정" icon={Terminal}>
              <p className="text-muted-foreground">Unix/macOS/Linux에서만 필요합니다:</p>
              <CodeBlock>{`chmod +x .claude/hooks/user_prompt_submit
chmod +x .claude/hooks/stop`}</CodeBlock>
              <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-500">Windows에서는 이 단계를 건너뛰세요.</p>
              </div>
            </StepCard>

            <StepCard step={4} title=".gitignore 업데이트" icon={Shield}>
              <p className="text-muted-foreground">프로젝트의 <code className="bg-muted px-1.5 py-0.5 rounded">.gitignore</code> 파일에 다음을 추가:</p>
              <CodeBlock language="gitignore">{`# CodeTracker
.codetracker/credentials.json
.codetracker/cache/`}</CodeBlock>
              <div className="flex items-start gap-2 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500"><strong>주의:</strong> credentials.json은 절대 Git에 커밋하지 마세요!</p>
              </div>
            </StepCard>

            <StepCard step={5} title="설치 테스트" icon={CheckCircle2}>
              <h4 className="font-semibold">방법 1: 수동 테스트</h4>
              <p className="text-muted-foreground text-sm">user_prompt_submit 테스트:</p>
              <CodeBlock>{`echo '{"prompt":"test prompt","session_id":"test-123","timestamp":"2024-01-01T00:00:00Z"}' | \\
  ./.claude/hooks/user_prompt_submit`}</CodeBlock>
              <p className="text-muted-foreground text-sm mt-2">성공하면 <code className="bg-muted px-1.5 py-0.5 rounded">.codetracker/cache/current_session.json</code> 파일이 생성됩니다.</p>

              <p className="text-muted-foreground text-sm mt-4">stop 테스트:</p>
              <CodeBlock>{`echo '{"timestamp":"2024-01-01T00:00:10Z"}' | \\
  ./.claude/hooks/stop`}</CodeBlock>

              <div className="border-t border-border/50 mt-6 pt-6">
                <h4 className="font-semibold">방법 2: Claude Code로 실제 테스트</h4>
                <CodeBlock>claude</CodeBlock>
                <p className="text-muted-foreground text-sm mt-2">Claude Code에서 간단한 프롬프트를 입력:</p>
                <CodeBlock>{`Create a new file called test.txt with "Hello World"`}</CodeBlock>
                <p className="text-muted-foreground text-sm mt-2">웹 대시보드에서 스냅샷과 상호작용이 기록되었는지 확인하세요.</p>
              </div>
            </StepCard>
          </div>
        </section>

        {/* 지원 플랫폼 */}
        <section className="px-4 py-12 bg-muted/20">
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
                        <th className="text-left py-3 px-4 font-semibold">바이너리 파일명</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Linux</td>
                        <td className="py-3 px-4">x64 (amd64)</td>
                        <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">user_prompt_submit</code>, <code className="bg-muted px-1.5 py-0.5 rounded">stop</code></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">Linux</td>
                        <td className="py-3 px-4">ARM64</td>
                        <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">user_prompt_submit</code>, <code className="bg-muted px-1.5 py-0.5 rounded">stop</code></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">macOS</td>
                        <td className="py-3 px-4">x64 (Intel)</td>
                        <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">user_prompt_submit</code>, <code className="bg-muted px-1.5 py-0.5 rounded">stop</code></td>
                      </tr>
                      <tr className="border-b border-border/30">
                        <td className="py-3 px-4">macOS</td>
                        <td className="py-3 px-4">ARM64 (Apple Silicon)</td>
                        <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">user_prompt_submit</code>, <code className="bg-muted px-1.5 py-0.5 rounded">stop</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Windows</td>
                        <td className="py-3 px-4">x64</td>
                        <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">user_prompt_submit.exe</code>, <code className="bg-muted px-1.5 py-0.5 rounded">stop.exe</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 문제 해결 */}
        <section className="px-4 py-12">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold">문제 해결</h2>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">훅이 실행되지 않음</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> Claude Code를 사용해도 스냅샷이 생성되지 않음</p>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">1. 실행 권한 확인 (Unix/macOS/Linux):</p>
                    <CodeBlock>ls -la .claude/hooks/</CodeBlock>
                    <p className="text-sm text-muted-foreground mt-2"><code>-rwxr-xr-x</code>와 같이 실행 권한(x)이 있어야 합니다.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">2. 바이너리 실행 테스트:</p>
                    <CodeBlock>./.claude/hooks/user_prompt_submit --help</CodeBlock>
                  </div>
                  <div>
                    <p className="font-medium mb-2">3. 플랫폼 확인:</p>
                    <CodeBlock>uname -m  # Linux/macOS</CodeBlock>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li><code>x86_64</code> → amd64 바이너리 사용</li>
                      <li><code>aarch64</code> 또는 <code>arm64</code> → arm64 바이너리 사용</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">인증 오류</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> 스냅샷이 서버에 저장되지 않음</p>
                <div>
                  <p className="font-medium mb-2">1. credentials.json 확인:</p>
                  <CodeBlock>cat .codetracker/credentials.json</CodeBlock>
                  <p className="text-sm text-muted-foreground mt-2"><code>api_key</code>와 <code>current_project_hash</code>가 있는지 확인</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">Windows에서 경로 문제</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> Windows에서 훅을 찾을 수 없음</p>
                <p className="font-medium mb-2"><code>.claude/settings.json</code>에서 백슬래시 사용:</p>
                <CodeBlock language="json">{`{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": ".claude\\\\hooks\\\\user_prompt_submit.exe"
      }]
    }]
  }
}`}</CodeBlock>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-xl">스냅샷이 생성되지 않음</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><strong>문제:</strong> 훅은 실행되지만 스냅샷이 기록되지 않음</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>1. 파일 변경 확인:</strong> <code>config.json</code>의 <code>auto_snapshot.only_on_changes</code>가 <code>true</code>이면 파일이 실제로 변경되어야 합니다.</li>
                  <li><strong>2. 추적 확장자 확인:</strong> 변경한 파일의 확장자가 <code>track_extensions</code>에 포함되어 있는지 확인</li>
                  <li><strong>3. 무시 패턴 확인:</strong> 파일이 <code>ignore_patterns</code>에 의해 무시되고 있지 않은지 확인</li>
                </ul>
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
    </div>
  )
}
