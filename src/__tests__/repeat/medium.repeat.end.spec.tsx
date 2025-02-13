// src/__tests__/repeat/medium.repeat.end.spec.tsx
import { render, screen, within } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react';
import App from "../../App";
import userEvent from '@testing-library/user-event';
import { setupMockHandlerCreation } from "../../__mocks__/handlersUtils";

describe('반복 종료 조건 설정', () => {
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
    
    if (eventData.repeatEndDate) {
      await user.clear(screen.getByLabelText(/반복 종료일/i));
      await user.type(screen.getByLabelText(/반복 종료일/i), eventData.repeatEndDate);
    }
  };
  
  describe('반복 종료일 설정', () => {
    it('종료일을 설정하지 않으면 기본값(2025-06-30)이 적용된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      await fillEventForm(user, {
        title: '종료일 미설정 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 이벤트 리스트에서 생성된 일정 확인
      const eventList = screen.getByTestId('event-list');
      // getAllByText를 사용하여 모든 매칭되는 요소를 찾음
      const eventDetails = within(eventList).getAllByText(/종료: 2025-06-30/);
      expect(eventDetails.length).toBeGreaterThan(0); // 최소 하나 이상 존재하는지 확인
    });
    
    it('특정 날짜까지 반복되는 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      await fillEventForm(user, {
        title: '종료일 지정 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily',
        repeatEndDate: '2024-10-05'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 이벤트 리스트에서 생성된 일정 확인
      const eventList = screen.getByTestId('event-list');
      const eventDetails = within(eventList).getAllByText(/종료: 2024-10-05/);
      expect(eventDetails.length).toBeGreaterThan(0);
      
      // 시작일부터 종료일까지의 일정이 모두 생성되었는지 확인
      const eventTitles = await within(eventList).findAllByText(/종료일 지정 테스트/);
      expect(eventTitles).toHaveLength(5); // 10/1 ~ 10/5까지 5개의 일정
    });
    
    it('반복 종료일은 시작일 이후여야 한다', async () => {
      const user = userEvent.setup();
      
      await fillEventForm(user, {
        title: '종료일 오류 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily',
        repeatEndDate: '2024-09-30' // 시작일보다 이전 날짜
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // Toast 경고 메시지 확인
      const errorTitle = await screen.findByText('종료일 오류');
      const errorDescription = await screen.findByText('종료일은 시작일 이후여야 합니다.');
      
      expect(errorTitle).toBeInTheDocument();
      expect(errorDescription).toBeInTheDocument();
      
      // 이벤트가 생성되지 않았는지 확인
      const eventList = screen.getByTestId('event-list');
      const events = within(eventList).queryAllByText(/종료일 오류 테스트/);
      expect(events).toHaveLength(0);
    });
    
    it('월간 반복에서 종료일이 없는 경우 기본값이 적용된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();
      
      await fillEventForm(user, {
        title: '월간 반복 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'monthly'
      });
      
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      const eventList = screen.getByTestId('event-list');
      const eventDetails = within(eventList).getByText(/종료: 2025-06-30/);
      expect(eventDetails).toBeInTheDocument();
      
      // 2024-10-01부터 2025-06-30까지의 월간 반복 일정 확인
      const events = await within(eventList).findAllByText(/월간 반복 테스트/);
      expect(events.length).toBeGreaterThan(0);
    });
  });
});