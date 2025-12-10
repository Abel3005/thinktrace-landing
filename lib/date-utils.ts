import { format, startOfWeek, addDays, subDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 개별 날짜의 기여도 데이터
 */
export interface ContributionDay {
  date: Date;
  commitCount: number;
  interactionCount: number;
  totalCount: number;
}

/**
 * 주 단위 데이터 (7일 = 일~토)
 * - days 배열은 7개 요소를 가지며, 범위 밖 날짜는 null
 */
export interface ContributionWeek {
  weekNumber: number;
  days: (ContributionDay | null)[];
}

/**
 * 월 레이블 정보
 * - GitHub 스타일 히트맵 상단에 표시할 월 이름과 위치
 */
export interface MonthLabel {
  name: string; // 월 이름 (예: "1월", "2월")
  colIndex: number; // 주 인덱스 (0부터 시작)
}

/**
 * GitHub 스타일 기여도 그리드 생성
 *
 * @param data - 날짜별 기여도 데이터 배열
 * @returns 주 단위 그리드 및 월 레이블
 *
 * @description
 * - 365일 데이터를 주 단위 (일~토) 열로 변환
 * - 시작 날짜가 속한 주의 일요일부터 시작하여 그리드 정렬
 * - 범위 밖 날짜는 null로 표시
 * - 각 월의 첫 등장 위치를 계산하여 월 레이블 생성
 *
 * @example
 * const { weeks, monthLabels } = generateContributionGrid(data);
 * console.log(`Total weeks: ${weeks.length}`);
 * console.log(`Months: ${monthLabels.map(m => m.name).join(', ')}`);
 */
export function generateContributionGrid(
  data: ContributionDay[]
): { weeks: ContributionWeek[]; monthLabels: MonthLabel[] } {
  const today = new Date();
  const startDate = subDays(today, 364); // 365일 (오늘 포함)
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // 일요일 시작

  // 날짜별 데이터 맵 생성 (빠른 조회를 위한 Map 사용)
  const dataMap = new Map(
    data.map(d => [format(d.date, 'yyyy-MM-dd'), d])
  );

  const weeks: ContributionWeek[] = [];
  const monthLabels: MonthLabel[] = [];
  let currentDate = weekStart;
  let weekIndex = 0;
  let prevMonth = -1;

  // 주 단위로 반복하여 그리드 생성
  while (currentDate <= today) {
    const week: (ContributionDay | null)[] = [];

    // 한 주의 7일 생성 (일~토)
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // 범위 밖 날짜는 null로 처리
      if (currentDate < startDate || currentDate > today) {
        week.push(null);
      } else {
        // 데이터가 있으면 사용, 없으면 0으로 초기화
        const dayData = dataMap.get(dateStr) || {
          date: new Date(currentDate),
          commitCount: 0,
          interactionCount: 0,
          totalCount: 0
        };
        week.push(dayData);
      }

      // 월 레이블 생성 (각 월의 첫 등장 시, 일요일에만)
      const month = currentDate.getMonth();
      if (dayOfWeek === 0 && month !== prevMonth) {
        monthLabels.push({
          name: format(currentDate, 'MMM', { locale: ko }),
          colIndex: weekIndex
        });
        prevMonth = month;
      }

      currentDate = addDays(currentDate, 1);
    }

    weeks.push({ weekNumber: weekIndex, days: week });
    weekIndex++;
  }

  return { weeks, monthLabels };
}

/**
 * 활동 횟수에 따른 색상 레벨 계산
 *
 * @param count - 활동 횟수 (커밋 + AI 인터랙션)
 * @returns 0~4 사이의 레벨 값
 *
 * @description
 * GitHub 스타일 5단계 색상 구분:
 * - 0: 활동 없음 (0개)
 * - 1: 최소 활동 (1-2개)
 * - 2: 보통 활동 (3-5개)
 * - 3: 활발한 활동 (6-10개)
 * - 4: 매우 활발한 활동 (11개 이상)
 *
 * @example
 * getActivityLevel(0);  // 0
 * getActivityLevel(1);  // 1
 * getActivityLevel(3);  // 2
 * getActivityLevel(8);  // 3
 * getActivityLevel(15); // 4
 */
export function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

/**
 * Supabase RPC 응답을 ContributionDay 배열로 변환
 *
 * @param rawData - Supabase에서 받은 원시 데이터
 * @returns ContributionDay 타입 배열
 *
 * @description
 * - date 문자열을 Date 객체로 파싱
 * - snake_case 필드명을 camelCase로 변환
 *
 * @example
 * const { data } = await supabase.rpc('get_daily_contributions', ...);
 * const contributions = transformContributionData(data);
 */
export function transformContributionData(
  rawData: { date: string; commit_count: number; interaction_count: number; total_count: number }[]
): ContributionDay[] {
  return rawData.map(d => ({
    date: parseISO(d.date),
    commitCount: d.commit_count,
    interactionCount: d.interaction_count,
    totalCount: d.total_count
  }));
}
