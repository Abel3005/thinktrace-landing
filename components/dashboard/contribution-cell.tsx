"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const ACTIVITY_COLORS = {
  0: 'bg-muted/30 border-border/20',
  1: 'bg-primary/20 border-primary/30',
  2: 'bg-primary/40 border-primary/50',
  3: 'bg-primary/60 border-primary/70',
  4: 'bg-primary/90 border-primary',
} as const;

const ACTIVITY_HOVER = {
  0: 'hover:bg-muted/50',
  1: 'hover:bg-primary/30',
  2: 'hover:bg-primary/50',
  3: 'hover:bg-primary/70',
  4: 'hover:bg-primary',
} as const;

interface ContributionCellProps {
  date: Date;
  commitCount: number;
  interactionCount: number;
  totalCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function ContributionCell({ date, commitCount, interactionCount, totalCount, level }: ContributionCellProps) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "h-3 w-3 rounded-sm border transition-all cursor-pointer",
            ACTIVITY_COLORS[level],
            ACTIVITY_HOVER[level]
          )}
          aria-label={`${format(date, 'yyyy년 M월 d일', { locale: ko })}: ${totalCount}개 활동`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="space-y-1">
          <p className="font-semibold">{format(date, 'yyyy년 M월 d일 (E)', { locale: ko })}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <p>커밋: {commitCount}개</p>
            <p>AI 인터랙션: {interactionCount}개</p>
            <p className="font-medium text-foreground">총 {totalCount}개 활동</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
