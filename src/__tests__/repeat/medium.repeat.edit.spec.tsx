// src/__tests__/repeat/medium.repeat.single.edit.spec.tsx
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupMockHandlerCreation, setupMockHandlerUpdating } from '../../__mocks__/handlersUtils';
import App from '../../App';

describe('반복 일정 단일 수정', () => {
  beforeEach(() => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });

  describe('반복 일정의 단일 수정', () => {
    it('반복 일정을 수정하면 단일 일정으로 변경된다', async () => {
      setupMockHandlerCreation();

      const user = userEvent.setup();

      // 1. 반복 일정 생성
      await user.type(screen.getByLabelText(/제목/i), '반복 일정 테스트');
      await user.clear(screen.getByLabelText(/날짜/i));
      await user.type(screen.getByLabelText(/날짜/i), '2024-10-01');
      await user.type(screen.getByLabelText(/시작 시간/i), '09:00');
      await user.type(screen.getByLabelText(/종료 시간/i), '10:00');

      // 반복 설정
      const repeatTypeSelect = screen.getByTestId('repeat-type');
      await user.selectOptions(repeatTypeSelect, 'daily');
      await user.type(screen.getByLabelText(/반복 종료일/i), '2024-10-05');

      // 저장
      await user.click(screen.getByTestId('event-submit-button'));

      // 2. 생성된 반복 일정 확인
      await waitFor(async () => {
        const events = screen.getAllByText('반복 일정 테스트');
        expect(events.length).toBeGreaterThan(5);
      });

      setupMockHandlerUpdating();
      // 3. 첫 번째 일정 수정
      const editButtons = screen.getAllByLabelText('Edit event');
      // console.log("editButtons", editButtons[0])
      await user.click(editButtons[0]);
      // 4. 반복 설정 해제 및 내용 수정
      const repeatCheckbox = screen.getByRole('checkbox', { name: /반복 일정/i });
      await user.click(repeatCheckbox); // 반복 설정 해제
      console.log('ssss', await screen.getByLabelText(/제목/i).value);
      await user.clear(screen.getByLabelText(/제목/i));
      await user.type(screen.getByLabelText(/제목/i), '수정된 단일 일정2');
      console.log('ssss', await screen.getByLabelText(/제목/i).value);
      // 5. 수정사항 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);

      // 6. 수정된 일정 확인 - 이벤트 리스트 내에서 찾기
      const eventList = screen.getByTestId('event-list');
      await waitFor(
        () => {
          const modifiedEvent = within(eventList).getAllByText('수정된 단일 일정2');
          expect(modifiedEvent).toHaveLength(1); // 수정된 일정은 하나만 있어야 함
        },
        { timeout: 5000 }
      );
    });
  });
});
