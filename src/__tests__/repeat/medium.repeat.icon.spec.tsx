// src/__tests__/repeat/medium.repeat.icon.spec.tsx
import { render, screen, within } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react';
import App from "../../App";
import userEvent from '@testing-library/user-event';
import { setupMockHandlerCreation } from "../../__mocks__/handlersUtils";

describe('반복 일정 표시 기능', () => {
  beforeEach(() => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });
  
  const fillEventForm = async (user: ReturnType<typeof userEvent.setup>, eventData: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    repeatType: string;
    repeatInterval?: string;
    repeatEndDate?: string;
  }) => {
    await user.type(screen.getByLabelText(/제목/i), eventData.title);
    await user.clear(screen.getByLabelText(/날짜/i));
    await user.type(screen.getByLabelText(/날짜/i), eventData.date);
    
    if (eventData.startTime) {
      await user.type(screen.getByLabelText(/시작 시간/i), eventData.startTime);
    }
    if (eventData.endTime) {
      await user.type(screen.getByLabelText(/종료 시간/i), eventData.endTime);
    }
    
    const repeatSelect = screen.getByTestId('repeat-type');
    await user.selectOptions(repeatSelect, eventData.repeatType);
    
    if (eventData.repeatInterval) {
      await user.clear(screen.getByLabelText(/반복 간격/i));
      await user.type(screen.getByLabelText(/반복 간격/i), eventData.repeatInterval);
    }
    
    if (eventData.repeatEndDate) {
      await user.clear(screen.getByLabelText(/반복 종료일/i));
      await user.type(screen.getByLabelText(/반복 종료일/i), eventData.repeatEndDate);
    }
  };
  
  describe('캘린더 뷰에서의 반복 일정 표시', () => {
    it('월간 뷰에서 반복 일정 아이콘이 표시된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      // 반복 일정 생성
      await fillEventForm(user, {
        title: '매주 반복 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'weekly',
        repeatInterval: '1',
        repeatEndDate: '2024-10-22'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 월간 뷰 선택
      const viewSelect = screen.getByLabelText('view');
      await user.selectOptions(viewSelect, 'month');
      
      // 월간 뷰에서 반복 일정 확인
      const monthView = screen.getByTestId('month-view');
      const repeatIcons = within(monthView).queryAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBeGreaterThan(0);
    });
    
    it('주간 뷰에서 반복 일정 아이콘이 표시된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      // 반복 일정 생성
      await fillEventForm(user, {
        title: '매일 반복 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily',
        repeatInterval: '1',
        repeatEndDate: '2024-10-07'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 주간 뷰 선택
      const viewSelect = screen.getByLabelText('view');
      await user.selectOptions(viewSelect, 'week');
      
      // 주간 뷰에서 반복 일정 확인
      const weekView = screen.getByTestId('week-view');
      const repeatIcons = within(weekView).queryAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBeGreaterThan(0);
    });
    
    it('이벤트 리스트에서 반복 일정 아이콘이 표시된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      // 반복 일정 생성
      await fillEventForm(user, {
        title: '매월 반복 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'monthly',
        repeatInterval: '1',
        repeatEndDate: '2024-12-01'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 이벤트 리스트에서 반복 일정 확인
      const eventList = screen.getByTestId('event-list');
      const repeatIcons = within(eventList).queryAllByTestId('repeat-icon');
      expect(repeatIcons.length).toBeGreaterThan(0);
    });
  });
});