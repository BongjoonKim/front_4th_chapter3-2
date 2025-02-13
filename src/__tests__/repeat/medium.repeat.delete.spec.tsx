// src/__tests__/repeat/medium.repeat.single.delete.spec.tsx
import { render, screen, waitFor, within } from "@testing-library/react";
import { ChakraProvider } from '@chakra-ui/react';
import App from "../../App";
import userEvent from '@testing-library/user-event';
import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating
} from "../../__mocks__/handlersUtils";

describe('반복 일정 단일 삭제', () => {
  beforeEach(() => {

    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });
  
  describe('반복 일정의 단일 삭제', () => {
    it('반복 일정 중 하나를 삭제하면 해당 일정만 삭제된다', async () => {
      setupMockHandlerCreation();  // 생성 핸들러 설정
      // setupMockHandlerDeletion();  // 삭제 핸들러 설정
      
      
      const user = userEvent.setup();
      
      // 1. 반복 일정 생성
      await user.type(screen.getByLabelText(/제목/i), '반복 일정 테스트');
      await user.clear(screen.getByLabelText(/날짜/i));
      await user.type(screen.getByLabelText(/날짜/i), '2024-10-01');
      await user.type(screen.getByLabelText(/시작 시간/i), '09:00');
      await user.type(screen.getByLabelText(/종료 시간/i), '10:00');
      
      // 반복 설정 - 매일 반복, 5일간
      const repeatTypeSelect = screen.getByTestId('repeat-type');
      await user.selectOptions(repeatTypeSelect, 'daily');
      await user.clear(screen.getByLabelText(/반복 종료일/i));
      await user.type(screen.getByLabelText(/반복 종료일/i), '2024-10-05');
      
      // 저장
      const submitButton = screen.getByTestId('event-submit-button');
      await user.click(submitButton);
      
      // 2. 생성된 반복 일정 확인
      const eventList = screen.getByTestId('event-list');
      let events = within(eventList).getAllByText('반복 일정 테스트');
      expect(events).toHaveLength(5); // 10/1부터 10/5까지 5개의 일정
      
      
      // 3. 첫 번째 일정 삭제
      const deleteButtons = screen.getAllByLabelText('Delete event');
      await user.click(deleteButtons[0]);
      
      // 4. 삭제 후 남은 일정 확인
      await waitFor(() => {
        events = within(eventList).getAllByText('반복 일정 테스트');
        expect(events).toHaveLength(4);
      });
      
      // 5. 남은 일정에 반복 아이콘이 표시되는지 확인
      const repeatIcons = within(eventList).getAllByTestId('repeat-icon');
      expect(repeatIcons).toHaveLength(4); // 남은 4개의 일정에 반복 아이콘이 있어야 함
    });
  });
});