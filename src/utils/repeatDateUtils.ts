import { Event, EventForm } from '../types';

/**
 * 해당 월의 마지막 날짜를 반환합니다.
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 반복 일정의 날짜를 조정합니다.
 * 윤년이나 월말 등의 특수한 경우를 처리합니다.
 */
export function adjustRepeatDate(
  originalDate: string,
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string {
  const date = new Date(originalDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // daily나 weekly는 조정이 필요 없음
  if (repeatType === 'daily' || repeatType === 'weekly') {
    return originalDate;
  }
  
  // 월말 날짜 확인
  const lastDayOfMonth = getLastDayOfMonth(year, month);
  
  // 29, 30, 31일의 경우 반복 달의 마지막 날로 조정
  if (day >= 29) {
    // 매월/매년 반복시 해당 월의 마지막 날로 조정
    if (repeatType === 'monthly' || repeatType === 'yearly') {
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    }
  }
  
  return originalDate;
}


export function generateRepeatingEvents(eventData: EventForm): EventForm[] {
  const events: EventForm[] = [];
  
  // 반복 일정이 아니면 원본 이벤트만 반환
  if (!eventData.repeat || eventData.repeat.type === 'none') {
    return [eventData];
  }
  
  const startDate = new Date(eventData.date);
  const endDate = eventData.repeat.endDate
    ? new Date(eventData.repeat.endDate)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()); // 기본값 1년
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    events.push({
      ...eventData,
      date: currentDate.toISOString().split('T')[0],
    });
    
    // 반복 타입에 따라 다음 날짜 계산
    switch (eventData.repeat.type) {
      case 'daily':
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + eventData.repeat.interval));
        break;
      case 'weekly':
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * eventData.repeat.interval)));
        break;
      case 'monthly':
        // 월 단위 반복시 같은 날짜 유지
        const nextMonth = currentDate.getMonth() + eventData.repeat.interval;
        currentDate = new Date(currentDate.setMonth(nextMonth));
        
        // 윤년이나 월말 등 특수한 경우 처리
        const originalDay = startDate.getDate();
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        if (originalDay > lastDayOfMonth) {
          currentDate.setDate(lastDayOfMonth);
        } else {
          currentDate.setDate(originalDay);
        }
        break;
      case 'yearly':
        // 연 단위 반복시 윤년 고려
        const nextYear = currentDate.getFullYear() + eventData.repeat.interval;
        currentDate = new Date(currentDate.setFullYear(nextYear));
        
        // 2월 29일 처리
        if (currentDate.getMonth() === 1 && startDate.getDate() === 29) {
          const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
          if (!isLeapYear(nextYear)) {
            currentDate.setDate(28);
          }
        }
        break;
    }
  }
  
  return events;
}