// src/hooks/useEventOperations.ts
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Event, EventForm } from '../types';
import { generateRepeatingEvents } from "../utils/repeatDateUtils.ts";

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const toast = useToast();
  
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: '이벤트 로딩 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;
      
      if (editing) {
        const existingEvent = events.find(e => e.id === (eventData as Event).id);
        
        // 1. 기존에 반복 일정이었으나 수정하는 경우 (단일 일정으로 변경)
        if (existingEvent?.repeat?.id) {
          // repeat 관련 정보 제거 (단일 일정으로 변경)
          const singleEventData = {
            ...eventData,
            repeat: { type: 'none', interval: 1 }
          };
          
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singleEventData),
          });
        }
        // 2. 일반 수정인 경우
        else {
          if (eventData.repeat && eventData.repeat.type !== 'none') {
            // 새로운 반복 일정 생성
            const repeatingEvents = generateRepeatingEvents(eventData);
            response = await fetch('/api/events-list', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ events: repeatingEvents }),
            });
          } else {
            // 단일 일정 수정
            response = await fetch(`/api/events/${(eventData as Event).id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            });
          }
        }
      } else {
        // 새로운 일정 생성
        if (eventData.repeat && eventData.repeat.type !== 'none') {
          const repeatingEvents = generateRepeatingEvents(eventData);
          response = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: repeatingEvents }),
          });
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to save event');
      }
      
      await fetchEvents();
      onSave?.();
      toast({
        title: editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: '일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const deleteEvent = async (id: string) => {
    try {
      const eventToDelete = events.find(event => event.id == id);
      
      if (!eventToDelete) {
        throw new Error('Event not found');
      }
      
      let response;
      
      // 반복 일정인 경우
      if (eventToDelete.repeat && eventToDelete.repeat.type !== 'none') {
        response = await fetch('/api/events-list', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventIds: [eventToDelete.id]
          }),
        });
      } else {
        // 일반 일정인 경우
        response = await fetch(`/api/events/${id}`, {
          method: 'DELETE'
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      await fetchEvents();
      toast({
        title: '일정이 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: '일정 삭제 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  useEffect(() => {
    fetchEvents();
    toast({
      title: '일정 로딩 완료!',
      status: 'info',
      duration: 1000,
    });
  }, []);
  
  return { events, fetchEvents, saveEvent, deleteEvent };
};