"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ContributionCell } from "./contribution-cell"
import { generateContributionGrid, getActivityLevel, ContributionDay } from "@/lib/date-utils"
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FolderGit2, GitCommit, Sparkles, FileEdit } from "lucide-react"

const ACTIVITY_COLORS = {
  0: 'bg-muted/30 border-border/20',
  1: 'bg-primary/20 border-primary/30',
  2: 'bg-primary/40 border-primary/50',
  3: 'bg-primary/60 border-primary/70',
  4: 'bg-primary/90 border-primary',
} as const;

interface ContributionHeatmapProps {
  data: ContributionDay[];
  stats: {
    total_projects: number;
    total_snapshots: number;
    total_interactions: number;
    total_files_changed: number;
  } | null;
}

export function ContributionHeatmap({ data, stats }: ContributionHeatmapProps) {
  const [displayDays, setDisplayDays] = useState(365);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDisplayDays(90);
      } else if (window.innerWidth < 1024) {
        setDisplayDays(180);
      } else {
        setDisplayDays(365);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleData = data.slice(-displayDays);
  const { weeks, monthLabels } = generateContributionGrid(visibleData);

  const statItems = [
    {
      title: "프로젝트",
      value: stats?.total_projects ?? 0,
      icon: FolderGit2,
      color: "text-primary",
    },
    {
      title: "커밋",
      value: stats?.total_snapshots ?? 0,
      icon: GitCommit,
      color: "text-blue-500",
    },
    {
      title: "AI 인터랙션",
      value: stats?.total_interactions ?? 0,
      icon: Sparkles,
      color: "text-purple-500",
    },
    {
      title: "파일 변경",
      value: stats?.total_files_changed ?? 0,
      icon: FileEdit,
      color: "text-green-500",
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* 왼쪽: 종합 정보 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">활동 요약</h2>
              <p className="text-sm text-muted-foreground">최근 {displayDays}일간의 활동</p>
            </div>

            <div className="space-y-3">
              {statItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                      <Icon className={cn("h-5 w-5", item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">활동 수준</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">적음</span>
                <div className="flex gap-1">
                  {([0, 1, 2, 3, 4] as const).map(level => (
                    <div
                      key={level}
                      className={cn("h-3 w-3 rounded-sm border", ACTIVITY_COLORS[level])}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">많음</span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 히트맵 */}
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1 min-w-fit">
              {/* 월 레이블 */}
              <div className="relative h-4 pl-6 mb-1">
                <div className="flex gap-1">
                  {monthLabels.map((month, idx) => {
                    const marginLeft = idx === 0 ? 0 : (month.colIndex - monthLabels[idx - 1].colIndex) * 16;
                    return (
                      <div
                        key={month.colIndex}
                        className="text-xs text-muted-foreground hidden sm:block"
                        style={{
                          marginLeft: `${marginLeft}px`,
                          minWidth: '32px',
                        }}
                      >
                        {month.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 그리드 */}
              <div className="flex gap-1">
                {/* 요일 레이블 */}
                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground justify-around pr-1">
                  <div className="h-3">월</div>
                  <div className="h-3"></div>
                  <div className="h-3">수</div>
                  <div className="h-3"></div>
                  <div className="h-3">금</div>
                  <div className="h-3"></div>
                  <div className="h-3"></div>
                </div>

                {/* 주별 열 */}
                <TooltipProvider>
                  <div className="flex gap-1">
                    {weeks.map((week) => (
                      <div key={week.weekNumber} className="flex flex-col gap-1">
                        {week.days.map((day, dayIdx) => (
                          <div key={dayIdx} className="h-3 w-3">
                            {day ? (
                              <ContributionCell
                                date={day.date}
                                commitCount={day.commitCount}
                                interactionCount={day.interactionCount}
                                totalCount={day.totalCount}
                                level={getActivityLevel(day.totalCount)}
                              />
                            ) : (
                              <div className="h-3 w-3" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
