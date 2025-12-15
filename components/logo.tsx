import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function ThinkTraceLogo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* 뇌/생각을 상징하는 원형 베이스 */}
      <circle
        cx="12"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* 생각의 흐름을 나타내는 내부 경로 - 뇌의 주름 형태 */}
      <path
        d="M8 7C8 7 9.5 9 12 9C14.5 9 16 7 16 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 11C8 11 9.5 13 12 13C14.5 13 16 11 16 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 트레이스/추적을 상징하는 하단 점들 - 생각의 발자취 */}
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      <circle cx="12" cy="23" r="1" fill="currentColor" opacity="0.6" />

      {/* 중앙의 빛나는 점 - 아이디어/인사이트 */}
      <circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

// 대체 로고 - 더 추상적인 "생각하는 코드" 컨셉
export function ThinkTraceLogoAlt({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* 전구/아이디어 형태의 상단 */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* 내부 회로/코드 패턴 */}
      <path
        d="M9 8L11 10L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="13"
        y1="12"
        x2="15"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* 하단 베이스 */}
      <rect x="9" y="20" width="6" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}

// 미니멀 로고 - 생각 말풍선 + 코드
export function ThinkTraceLogoMinimal({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* 생각 말풍선 */}
      <path
        d="M21 11C21 15.97 16.97 20 12 20C10.82 20 9.69 19.78 8.65 19.37L3 21L4.63 15.35C4.22 14.31 4 13.18 4 12C4 7.03 8.03 3 13 3H12C16.97 3 21 7.03 21 12V11Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 코드 기호 < > */}
      <path
        d="M10 9L8 12L10 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9L16 12L14 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
