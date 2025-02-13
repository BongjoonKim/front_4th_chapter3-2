import { Event, EventForm } from '../types';
import { formatDate } from './dateUtils.ts';
// src/utils/repeatDateUtils.ts
/**
 * 해당 월의 마지막 날짜를 반환합니다.
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0, 23, 59, 59, 99).getDate();
}

/**
 * 반복 일정의 날짜를 조정합니다.
 * 윤년이나 월말 등의 특수한 경우를 처리합니다.
 */
export function adjustRepeatDate(
  originalDate: string,
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly'
): { adjustedDate: string; isLastDay: boolean } {
  const date = new Date(originalDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // daily나 weekly는 조정이 필요 없음
  if (repeatType === 'daily' || repeatType === 'weekly') {
    return { adjustedDate: originalDate, isLastDay: false };
  }

  // 윤년 체크 함수
  const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  if (repeatType === 'yearly' && month === 2 && day === 29) {
    // 윤년의 2월 29일인 경우, 다음 해는 2월 28일로 조정
    const adjustedDate = `${year}-02-28`;
    return {
      adjustedDate,
      isLastDay: true,
    };
  }

  // 월말 날짜 확인
  const lastDayOfMonth = getLastDayOfMonth(year, month);

  // 29, 30, 31일의 경우 반복 달의 마지막 날로 조정
  if (day >= 29) {
    // 매월/매년 반복시 해당 월의 마지막 날로 조정
    if (repeatType === 'monthly' || repeatType === 'yearly') {
      const adjustedDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
      return {
        adjustedDate,
        isLastDay: day === lastDayOfMonth,
      };
    }
  }

  return { adjustedDate: originalDate, isLastDay: false };
}

export function generateRepeatingEvents(eventData: EventForm): EventForm[] {
  const events: EventForm[] = [];

  if (!eventData.repeat || eventData.repeat.type === 'none') {
    return [eventData];
  }

  const startDate = new Date(eventData.date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = eventData.repeat.endDate
    ? new Date(eventData.repeat.endDate)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
  endDate.setHours(23, 59, 59, 999);

  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  console.log('시작 날짜', currentDate, currentDate.toISOString().split('T')[0]);
  while (currentDate <= endDate) {
    events.push({
      ...eventData,
      date: formatDate(currentDate),
    });

    const originalDay = startDate.getDate();

    switch (eventData.repeat.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + eventData.repeat.interval);
        break;

      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * eventData.repeat.interval);
        break;

      case 'monthly': {
        // 현재 연도와 월을 가져옴
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        // interval만큼의 월을 더함
        const targetMonth = currentMonth + eventData.repeat.interval;
        const yearIncrease = Math.floor(targetMonth / 12);
        const normalizedMonth = targetMonth % 12;

        // 원본이 월말이었는지 확인 (31, 30, 29, 28일 모두 포함)
        const originalMonthLastDay = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0
        ).getDate();
        console.log('originalMonthLastDay', originalMonthLastDay);
        const wasLastDayOfMonth = originalDay === originalMonthLastDay;
        console.log('wasLastDayOfMonth', originalDay);

        let newDate;
        if (wasLastDayOfMonth) {
          // 월말이었다면 다음 달의 마지막 날로 직접 설정
          newDate = new Date(currentYear + yearIncrease, normalizedMonth + 1, 0, 23, 59, 59, 999);
          console.log('막날 세팅', newDate);
        } else {
          // 월말이 아니었다면 원래 날짜 유지
          newDate = new Date(currentYear + yearIncrease, normalizedMonth, originalDay);
          // 다만 해당 월의 마지막 날보다 큰 경우 마지막 날로 조정
          const lastDayOfMonth = new Date(
            newDate.getFullYear(),
            newDate.getMonth() + 1,
            0
          ).getDate();
          if (originalDay > lastDayOfMonth) {
            newDate = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
          }
        }

        currentDate = newDate;
        break;
      }

      case 'yearly': {
        const currentYear = currentDate.getFullYear() + eventData.repeat.interval;
        const currentMonth = currentDate.getMonth();
        const isLeapYear = (year: number) =>
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        // 2월 29일 특별 처리
        if (currentMonth === 1 && originalDay === 29 && !isLeapYear(currentYear)) {
          currentDate = new Date(currentYear, currentMonth, 28);
        } else {
          currentDate = new Date(currentYear, currentMonth, originalDay);
        }
        break;
      }
    }
  }
  console.log('이벤트 목록', events);
  return events;
}
