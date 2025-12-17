"use client"

import { useRouter } from "next/navigation"
import { ShieldX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function AccessDeniedModal() {
  const router = useRouter()

  const handleConfirm = () => {
    router.push("/dashboard")
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle>접근 권한 없음</DialogTitle>
          <DialogDescription>
            관리자 페이지에 접근할 권한이 없습니다.
            <br />
            관리자 계정으로 로그인해 주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
