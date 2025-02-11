import { Event } from '../types';
import { getWeekDates, isDateInRange } from './dateUtils';
// src/utils/eventUtils.ts
function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  const filteredEvents: Event[] = [];
  
  events.forEach(event => {
    const eventDate = new Date(event.date);
      if (isDateInRange(eventDate, start, end)) {
        filteredEvents.push(event);
      }
  });
  
  return filteredEvents;
}

function getRepeatingEventInRange(event: Event, startDate: Date, endDate: Date): Event[] {
  // const repeatEvents: Event[] = [];
  // const eventStartDate = new Date(event.date);
  // let currentDate = new Date(eventStartDate);
  // const repeatEndDate = event.repeat.endDate ? new Date(event.repeat.endDate) : endDate;
  //
  // while (currentDate <= repeatEndDate && currentDate <= endDate) {
  //   if (currentDate >= startDate) {
  //     repeatEvents.push({
  //       ...event,
  //       date: currentDate.toISOString().split('T')[0],
  //       id: `${event.id}-${currentDate.toISOString()}`  // 반복 일정의 고유 ID 생성
  //     });
  //   }
  //
  //   // 반복 타입에 따라 다음 날짜 계산
  //   switch (event.repeat.type) {
  //     case 'daily':
  //       currentDate = new Date(currentDate.setDate(currentDate.getDate() + event.repeat.interval));
  //       break;
  //     case 'weekly':
  //       currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * event.repeat.interval)));
  //       break;
  //     case 'monthly':
  //       currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + event.repeat.interval));
  //       break;
  //     case 'yearly':
  //       currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + event.repeat.interval));
  //       break;
  //   }
  // }
  // console.log("이벤트", repeatEvents)
  
  // return repeatEvents;
  return [event];
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

function filterEventsByDateRangeAtWeek(events: Event[], currentDate: Date) {
  const weekDates = getWeekDates(currentDate);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

function filterEventsByDateRangeAtMonth(events: Event[], currentDate: Date) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 99);
  return filterEventsByDateRange(events, monthStart, monthEnd);
}

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);
  console.log("검색된 이벤트", searchedEvents)

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(searchedEvents, currentDate);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(searchedEvents, currentDate);
  }

  return searchedEvents;
}
