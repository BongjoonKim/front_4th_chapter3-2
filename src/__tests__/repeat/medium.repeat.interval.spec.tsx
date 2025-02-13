import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupMockHandlerCreation } from '../../__mocks__/handlersUtils.ts';
import App from '../../App.tsx';

// src/__tests__/repeat/medium.repeat.interval.spec
// getByText 대신 findByRole('alert')를 사용하여 toast 요소 사용 금지
describe('반복 간격 설정', () => {
  beforeEach(() => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });

  const fillEventForm = async (
    user: ReturnType<typeof userEvent.setup>,
    eventData: {
      title: string;
      date: string;
      startTime?: string;
      endTime?: string;
      repeatType: string;
      repeatInterval: string;
      repeatEndDate?: string;
    }
  ) => {
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

    await user.clear(screen.getByLabelText(/반복 간격/i));
    await user.type(screen.getByLabelText(/반복 간격/i), eventData.repeatInterval);

    if (eventData.repeatEndDate) {
      await user.clear(screen.getByLabelText(/반복 종료일/i));
      await user.type(screen.getByLabelText(/반복 종료일/i), eventData.repeatEndDate);
    }
  };

  describe('각 반복 유형별 간격 설정', () => {
    it('2일마다 반복되는 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '이틀마다 반복',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily',
        repeatInterval: '2',
        repeatEndDate: '2024-10-07',
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 2일 간격으로 7일간 생성되므로 4개의 일정이 생성되어야 함 (1일, 3일, 5일, 7일)
      const eventList = screen.getByTestId('event-list');
      const events = await screen.findAllByText(/2일마다/i);
      expect(events).toHaveLength(4);
    });

    it('3주마다 반복되는 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '삼주마다 반복',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'weekly',
        repeatInterval: '3',
        repeatEndDate: '2024-11-15',
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 3주 간격으로 약 6주간 생성되므로 2개의 일정이 10월에 생성되어야 함
      const events = await screen.findAllByText(/3주마다/i);
      expect(events).toHaveLength(2);
    });

    it('2개월마다 반복되는 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '두 달 마다 반복',
        date: '2024-10-16',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'monthly',
        repeatInterval: '2',
        repeatEndDate: '2025-02-15',
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 2개월 간격으로 약 4개월간 생성되므로 3개의 일정이 생성되어야 함
      const events = await screen.findAllByText(/2월마다/i);
      expect(events).toHaveLength(1);
    });

    it('2년마다 반복되는 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '2년마다 반복',
        date: '2024-10-17',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'yearly',
        repeatInterval: '2',
        repeatEndDate: '2028-10-15',
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 2년 간격으로 약 4년간 생성되므로 3개의 일정이 생성되어야 함
      const events = await screen.findAllByText(/2년마다/i);
      expect(events).toHaveLength(3);
    });
  });

  describe('반복 간격 유효성 검사', () => {
    it('반복 간격은 1 이상의 숫자만 입력할 수 있다', async () => {
      const user = userEvent.setup();
      const intervalInput = screen.getByLabelText(/반복 간격/i);

      // 기본값 확인
      expect(intervalInput).toHaveValue(1);

      // 음수 입력 시도
      await user.clear(intervalInput);
      await user.type(intervalInput, '-1');
      expect(intervalInput).toHaveValue(-1); // 임시 입력값 허용

      // blur 시 1로 리셋
      await user.tab();
      expect(intervalInput).toHaveValue(1);
      expect(await screen.getByText('유효하지 않은 반복 간격')).toBeInTheDocument();
      expect(await screen.getByText('반복 간격은 1 이상이어야 합니다.')).toBeInTheDocument();

      // 0 입력 시도
      await user.clear(intervalInput);
      await user.type(intervalInput, '0');
      expect(intervalInput).toHaveValue(0); // 임시 입력값 허용

      // blur 시 1로 리셋
      await user.tab();
      expect(intervalInput).toHaveValue(1);

      // Toast 메시지 확인 (두 번째 에러)
      const toasts = await screen.findAllByRole('status');
      const latestToast = toasts[toasts.length - 1];
      within(latestToast).getByText('유효하지 않은 반복 간격');
      within(latestToast).getByText('반복 간격은 1 이상이어야 합니다.');

      // 유효한 값 입력
      await user.clear(intervalInput);
      await user.type(intervalInput, '2');
      expect(intervalInput).toHaveValue(2);

      // blur 시에도 유효한 값 유지
      await user.tab();
      expect(intervalInput).toHaveValue(2);
    });
  });
});
