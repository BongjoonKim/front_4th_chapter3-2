import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from "../App.tsx";
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { adjustRepeatDate } from "../utils/repeatDateUtils.ts";


describe('반복 일정 선택 기능', () => {
  beforeEach(() => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
  });
  describe('반복 일정 기본 UI 테스트', () => {
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
  });
  describe('윤년/말일 날짜 자동 조정 테스트', () => {
    // 유틸리티 함수 테스트
    describe('adjustRepeatDate 함수 테스트', () => {
      it('윤년의 2월 29일을 매월 반복할 때 말일로 조정된다', () => {
        const result = adjustRepeatDate('2024-02-29', 'monthly');
        expect(result).toBe('2024-02-29'); // 2월은 29일까지 있으므로 그대로 유지
      });
      
      it('윤년의 2월 29일을 매년 반복할 때 비윤년에서는 2월 28일로 조정된다', () => {
        vi.setSystemTime(new Date('2025-02-01')); // 비윤년으로 설정
        const result = adjustRepeatDate('2024-02-29', 'yearly');
        expect(result).toBe('2025-02-28');
      });
      
      it('31일이 있는 달에서 31일을 매월 반복할 때 각 달의 말일로 조정된다', () => {
        const dates = [
          { input: '2024-01-31', expected: '2024-02-29' }, // 1월 -> 2월
          { input: '2024-03-31', expected: '2024-04-30' }, // 3월 -> 4월
          { input: '2024-05-31', expected: '2024-06-30' }, // 5월 -> 6월
        ];
        
        dates.forEach(({ input, expected }) => {
          const result = adjustRepeatDate(input, 'monthly');
          expect(result).toBe(expected);
        });
      });
    });
    
    // UI 통합 테스트
    describe('UI에서의 윤년 처리', () => {
      beforeEach(async () => {
        const user = userEvent.setup();
        
        // 기본 입력값 설정
        await user.type(screen.getByLabelText(/제목/i), '윤년 테스트');
        await user.click(screen.getByRole('checkbox', { name: /반복 일정/i }));
      });
      
      it('윤년의 2월 29일을 선택하고 매년 반복을 설정하면 경고가 표시된다', async () => {
        const user = userEvent.setup();
        
        // 2024년 2월 29일 선택
        await user.type(screen.getByLabelText(/날짜/i), '2024-02-29');
        
        // 매년 반복 선택
        const repeatTypeSelect = screen.getByTestId('repeat-type');
        await user.selectOptions(repeatTypeSelect, 'yearly');
        
        // 경고 메시지 확인
        expect(await screen.findByText(/날짜 자동 조정/i)).toBeInTheDocument();
        expect(screen.getByText(/반복 일정의 특성에 맞게 날짜가 조정되었습니다/i)).toBeInTheDocument();
      });
      
      it('31일을 선택하고 매월 반복을 설정하면 자동으로 조정된다', async () => {
        const user = userEvent.setup();
        
        // 1월 31일 선택
        await user.type(screen.getByLabelText(/날짜/i), '2024-01-31');
        
        // 매월 반복 선택
        const repeatTypeSelect = screen.getByTestId('repeat-type');
        await user.selectOptions(repeatTypeSelect, 'monthly');
        
        // 알림 메시지 확인
        expect(await screen.findByText(/날짜 자동 조정/i)).toBeInTheDocument();
      });
    });
  });
});