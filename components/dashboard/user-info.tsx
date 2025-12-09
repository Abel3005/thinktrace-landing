import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Building, Calendar } from "lucide-react"

interface UserInfoProps {
  user: {
    username: string
    email: string
    organization: string | null
    created_at: string
  } | null
}

export function UserInfo({ user }: UserInfoProps) {
  if (!user) return null

  const createdDate = new Date(user.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg">개인정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">사용자명</p>
            <p className="font-medium">{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">이메일</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
        {user.organization && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">조직</p>
              <p className="font-medium">{user.organization}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">가입일</p>
            <p className="font-medium">{createdDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
