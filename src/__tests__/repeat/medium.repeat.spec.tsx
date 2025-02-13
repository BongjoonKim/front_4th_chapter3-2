import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupMockHandlerCreation } from '../../__mocks__/handlersUtils.ts';
import App from '../../App.tsx';

// src/__tests__/repeat/medium.repeat.spec.tsx
describe('반복 일정 선택 기능', () => {
  beforeEach(() => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });
  describe('반복 일정 기본 UI 테스트', () => {
    const fillEventForm = async (
      user: ReturnType<typeof userEvent.setup>,
      eventData: {
        title: string;
        date: string;
        startTime?: string;
        endTime?: string;
        repeatType: string;
        repeatInterval?: string;
        repeatEndDate?: string;
      }
    ) => {
      // 기본 정보 입력
      await user.type(screen.getByLabelText(/제목/i), eventData.title);
      await user.clear(screen.getByLabelText(/날짜/i));
      await user.type(screen.getByLabelText(/날짜/i), eventData.date);

      // 시작/종료 시간 입력
      if (eventData.startTime) {
        await user.type(screen.getByLabelText(/시작 시간/i), eventData.startTime);
      }
      if (eventData.endTime) {
        await user.type(screen.getByLabelText(/종료 시간/i), eventData.endTime);
      }

      // 반복 설정

      const repeatSelect = screen.getByTestId('repeat-type');
      await user.selectOptions(repeatSelect, eventData.repeatType);

      // 반복 간격과 종료일 설정
      if (eventData.repeatInterval) {
        await user.clear(screen.getByLabelText(/반복 간격/i));
        await user.type(screen.getByLabelText(/반복 간격/i), eventData.repeatInterval);
      }
      if (eventData.repeatEndDate) {
        await user.clear(screen.getByLabelText(/반복 종료일/i));
        await user.type(screen.getByLabelText(/반복 종료일/i), eventData.repeatEndDate);
      }
    };

    it('반복 일정 체크박스의 기본값이 true로 설정되어 있다', () => {
      const repeatCheckbox = screen.getByRole('checkbox', { name: /반복 일정/i });
      expect(repeatCheckbox).toBeChecked();
    });

    it('반복 유형 선택 드롭다운에 모든 옵션이 존재한다', () => {
      const repeatTypeSelect = screen.getByTestId('repeat-type');

      expect(screen.queryByText('매일')).toBeInTheDocument();
      expect(screen.queryByText('매주')).toBeInTheDocument();
      expect(screen.queryByText('매월')).toBeInTheDocument();
      expect(screen.queryByText('매년')).toBeInTheDocument();
    });
    it('매일 반복 옵션을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const repeatSelect = screen.getByTestId('repeat-type');

      // 기본값이 매일인지 확인
      expect(repeatSelect).toHaveValue('daily');

      // 다른 옵션 선택 후 다시 매일 선택
      await user.selectOptions(repeatSelect, 'weekly');
      await user.selectOptions(repeatSelect, 'daily');
      expect(repeatSelect).toHaveValue('daily');

      // 옵션 텍스트 확인
      expect(screen.getByText('매일')).toBeInTheDocument();
    });

    it('매주 반복 옵션을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const repeatSelect = screen.getByTestId('repeat-type');

      await user.selectOptions(repeatSelect, 'weekly');
      expect(repeatSelect).toHaveValue('weekly');
      expect(screen.getByText('매주')).toBeInTheDocument();
    });

    it('매월 반복 옵션을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const repeatSelect = screen.getByTestId('repeat-type');

      await user.selectOptions(repeatSelect, 'monthly');
      expect(repeatSelect).toHaveValue('monthly');
      expect(screen.getByText('매월')).toBeInTheDocument();
    });

    it('매년 반복 옵션을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const repeatSelect = screen.getByTestId('repeat-type');

      await user.selectOptions(repeatSelect, 'yearly');
      expect(repeatSelect).toHaveValue('yearly');
      expect(screen.getByText('매년')).toBeInTheDocument();
    });

    it('모든 반복 유형 옵션이 존재한다', () => {
      const options = screen.getAllByRole('option');
      const optionTexts = options.map((option) => option.textContent);

      expect(optionTexts).toContain('매일');
      expect(optionTexts).toContain('매주');
      expect(optionTexts).toContain('매월');
      expect(optionTexts).toContain('매년');
    });

    it('반복 유형을 변경하면 선택한 값이 정확히 반영된다', async () => {
      const user = userEvent.setup();
      const repeatSelect = screen.getByTestId('repeat-type');

      // 순차적으로 모든 옵션 선택해보기
      const options = ['daily', 'weekly', 'monthly', 'yearly'];
      for (const option of options) {
        await user.selectOptions(repeatSelect, option);
        expect(repeatSelect).toHaveValue(option);
      }
    });

    it('매일 반복되는 일정이 올바르게 생성된다', async () => {
      setupMockHandlerCreation();

      const user = userEvent.setup();
      console.log('날짜', new Date()); // 폼 입력 전 상태 확인
      console.log('폼 입력 전:');
      screen.debug(screen.getByLabelText(/제목/i));
      screen.debug(screen.getByLabelText(/날짜/i));
      screen.debug(screen.getByLabelText(/시작 시간/i));
      screen.debug(screen.getByLabelText(/종료 시간/i));

      await fillEventForm(user, {
        title: '매일 반복 테스트',
        date: '2024-10-03',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'daily',
        repeatInterval: '1',
        repeatEndDate: '2024-10-05',
      });

      // 폼 입력 후 상태 확인
      console.log('폼 입력 후:');
      screen.debug(screen.getByLabelText(/제목/i));
      screen.debug(screen.getByLabelText(/날짜/i));
      screen.debug(screen.getByLabelText(/시작 시간/i));
      screen.debug(screen.getByLabelText(/종료 시간/i));

      // 반복 설정 확인
      console.log('반복 설정:', screen.getByTestId('repeat-type').value);

      // 일정 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 생성된 일정 확인
      const colView = await screen.getByTestId('month-view');
      // screen.debug(colView);

      // 이벤트 리스트 확인
      const eventList = screen.getByTestId('event-list');
      screen.debug(eventList);

      const { findAllByText } = within(eventList);
      const eventTitles = await findAllByText(/매일 반복/i);
      expect(eventTitles).toHaveLength(3);
    });

    it('매주 반복되는 일정이 올바르게 생성된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '매주 반복 테스트',
        date: '2024-10-01',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'weekly',
        repeatInterval: '1',
        repeatEndDate: '2024-10-22', // 4주 후
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 이벤트 리스트에서 생성된 일정 확인
      const eventList = screen.getByTestId('event-list');
      const { findAllByText } = within(eventList);
      const eventTitles = await findAllByText(/매주 반복/i);
      expect(eventTitles).toHaveLength(4); // 4주치 일정이 생성되어야 함
    });

    it('매월 반복되는 일정이 올바르게 생성된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '매월 반복 테스트',
        date: '2024-10-16',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'monthly',
        repeatInterval: '1',
        repeatEndDate: '2024-12-15', // 3개월 후
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 이벤트 리스트에서 생성된 일정 확인
      const eventList = screen.getByTestId('event-list');
      const { findAllByText } = within(eventList);
      const eventTitles = await findAllByText(/1월마다/i);
      expect(eventTitles).toHaveLength(1);

      // 11월로 이동
      const nextButton = screen.getByLabelText('Next');
      await user.click(nextButton);

      // 월간 뷰에서 11월 16일의 일정 확인
      const monthView = screen.getByTestId('month-view');
      const novemberCells = within(monthView).getAllByRole('cell');

      // 11월 16일이 있는 셀 찾기
      const nov16Cell = novemberCells.find((cell) => {
        const dayNumber = within(cell).queryByText('16');
        return dayNumber !== null;
      });

      // 11월 16일 셀에 반복 일정이 있는지 확인
      expect(within(nov16Cell!).getByText('매월 반복 테스트')).toBeInTheDocument();
      expect(within(nov16Cell!).getByTestId('repeat-icon')).toBeInTheDocument();

      // 이벤트 리스트에서도 11월 일정 확인
      const novemberEvents = within(eventList).getAllByText('매월 반복 테스트');
      expect(novemberEvents.length).toBeGreaterThan(0); // 최소 하나 이상의 일정이 있는지 확인

      // 11월 일정 삭제
      const deleteButtons = screen.getAllByLabelText('Delete event');
      await user.click(deleteButtons[0]); // 첫 번째 삭제 버튼 클릭

      // 일정이 삭제되었는지 확인
      // 1. 월간 뷰에서 확인
      expect(within(nov16Cell!).queryByText('매월 반복 테스트')).not.toBeInTheDocument();
    });

    it('매년 반복되는 일정이 올바르게 생성된다', async () => {
      setupMockHandlerCreation();
      const user = userEvent.setup();

      await fillEventForm(user, {
        title: '매년 반복 테스트',
        date: '2024-10-17',
        startTime: '09:00',
        endTime: '10:00',
        repeatType: 'yearly',
        repeatInterval: '1',
        repeatEndDate: '2026-10-15', // 3년 후
      });

      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 이벤트 리스트에서 생성된 일정 확인
      const eventList = screen.getByTestId('event-list');
      const { findAllByText } = within(eventList);
      const eventTitles = await findAllByText(/1년마다/i);
      expect(eventTitles).toHaveLength(1);
    });
  });

  describe('반복 일정 날짜 자동 조정', () => {
    it('매월 반복에서 31일 선택시 말일로 자동 조정된다', async () => {
      const user = userEvent.setup();

      // 제목 입력 (필수값)
      await user.type(screen.getByLabelText(/제목/i), '테스트 일정');

      // 2024년 1월 31일 선택
      await user.clear(screen.getByLabelText(/날짜/i));
      await user.type(screen.getByLabelText(/날짜/i), '2024-01-31');

      // 반복 일정 체크박스 선택
      // const repeatCheckbox = screen.getByRole('checkbox', { name: /반복 일정/i });
      // await user.click(repeatCheckbox);

      // 매월 반복 선택
      const repeatSelect = screen.getByTestId('repeat-type');
      await user.selectOptions(repeatSelect, 'monthly');

      // toast 메시지 확인
      const toastTitle = await screen.findByText('날짜 자동 조정');
      expect(toastTitle).toBeInTheDocument();

      const basicMessage =
        await screen.findByText(/반복 일정의 특성에 맞게 날짜가 조정되었습니다/i);
      expect(basicMessage).toBeInTheDocument();

      const lastDayMessage = await screen.findByText(/매 월\/년 마지막 날로 자동 설정됩니다/i);
      expect(lastDayMessage).toBeInTheDocument();
    });

    it('매년 반복에서 윤년(2월 29일) 선택시 2월 28일로 자동 조정된다', async () => {
      const user = userEvent.setup();

      // 제목 입력 (필수값)
      await user.type(screen.getByLabelText(/제목/i), '테스트 일정');

      // 2024년 2월 29일 (윤년) 선택
      await user.clear(screen.getByLabelText(/날짜/i));
      await user.type(screen.getByLabelText(/날짜/i), '2024-02-29');

      // 매년 반복 선택
      const repeatSelect = screen.getByTestId('repeat-type');
      await user.selectOptions(repeatSelect, 'yearly');

      // 알림 메시지 확인
      const toastTitle = await screen.findByText('날짜 자동 조정');
      expect(toastTitle).toBeInTheDocument();

      const toastMessage =
        await screen.findByText(/반복 일정의 특성에 맞게 날짜가 조정되었습니다/i);
      expect(toastMessage).toBeInTheDocument();
    });
  });
});
