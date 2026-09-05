import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPresetSlots, buildCustomSlots, buildGapSlots } from './timetable-presets.js';

test('중학교형(45분)은 상담 20분씩 두 개, 사이에 5분 여백을 둔다', () => {
  const slots = buildPresetSlots({ preset: 'middle', periodCount: 1, breakMinutes: 0, consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.start_time), ['09:00', '09:25']);
  assert.equal(slots.every(s => s.mode === 'both' && s.is_open === false), true);
});

test('고등학교형(50분)은 상담 20분씩 두 개, 사이에 10분 여백을 둔다', () => {
  const slots = buildPresetSlots({ preset: 'high', periodCount: 1, breakMinutes: 0, consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.start_time), ['09:00', '09:30']);
});

test('상담시간이 교시 절반보다 길면(30분, 45분 교시) 교시 시작 시각에 하나만 붙인다', () => {
  const slots = buildPresetSlots({ preset: 'middle', periodCount: 1, breakMinutes: 0, consultMinutes: 30 });
  assert.deepEqual(slots.map(s => s.start_time), ['09:00']);
});

test('여러 교시를 만들면 교시 사이 쉬는시간은 상담으로 안 쓴다', () => {
  const slots = buildPresetSlots({ preset: 'middle', periodCount: 2, breakMinutes: 10, consultMinutes: 20 });
  // 1교시 09:00~09:45(상담 09:00, 09:25), 쉬는시간 09:45~09:55, 2교시 09:55~10:40(상담 09:55, 10:20)
  assert.deepEqual(slots.map(s => s.start_time), ['09:00', '09:25', '09:55', '10:20']);
});

test('각 슬롯에 교시 번호와 교시 시간범위가 붙는다', () => {
  const slots = buildPresetSlots({ preset: 'middle', periodCount: 2, breakMinutes: 10, consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.period), [1, 1, 2, 2]);
  assert.equal(slots[0].period_range, '09:00~09:45');
  assert.equal(slots[2].period_range, '09:55~10:40');
});

test('알 수 없는 프리셋은 에러를 던진다', () => {
  assert.throws(() => buildPresetSlots({ preset: 'unknown' }), /알 수 없는 프리셋/);
});

test('직접 설정은 시작·종료 시각 사이를 상담 시간 단위로 자른다', () => {
  const slots = buildCustomSlots({ startTime: '13:00', endTime: '14:00', consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.start_time), ['13:00', '13:20', '13:40']);
});

test('직접 설정은 상담 시간이 안 맞아도 시작 시각 기준으로 딱 떨어지는 만큼만 만든다', () => {
  const slots = buildCustomSlots({ startTime: '13:00', endTime: '13:50', consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.start_time), ['13:00', '13:20', '13:40']);
});

test('학생용 여백 슬롯은 교시 안이 아니라 쉬는시간·점심시간 안에서만 만든다', () => {
  const slots = buildGapSlots({
    preset: 'middle', periodCount: 2, breakMinutes: 10, consultMinutes: 10, lunchAfterPeriod: null,
  });
  // 1교시 09:00~09:45, 쉬는시간 09:45~09:55(상담 09:45), 2교시 09:55~10:40 뒤로는 안 만든다(마지막 교시)
  assert.deepEqual(slots.map(s => s.start_time), ['09:45']);
  assert.equal(slots[0].period_label, '쉬는시간(1교시~2교시)');
});

test('점심시간은 몇 교시 뒤든 상관없이 여백 슬롯을 만들고 점심시간이라고 표시한다', () => {
  const slots = buildGapSlots({
    preset: 'middle', periodCount: 2, breakMinutes: 10, consultMinutes: 20,
    lunchAfterPeriod: 1, lunchMinutes: 50,
  });
  // 1교시 09:00~09:45, 점심 09:45~10:35(상담 09:45, 10:05, 10:25), 2교시 10:35~11:20 뒤로는 안 만든다
  assert.deepEqual(slots.map(s => s.start_time), ['09:45', '10:05', '10:25']);
  assert.equal(slots.every(s => s.period_label === '점심시간'), true);
});

test('마지막 교시 뒤 쉬는시간은 방과후와 겹치니 학생용 여백 슬롯을 만들지 않는다', () => {
  const slots = buildGapSlots({ preset: 'middle', periodCount: 1, breakMinutes: 10, consultMinutes: 10 });
  assert.deepEqual(slots, []);
});

test('알 수 없는 프리셋을 학생용 여백 슬롯에 넣어도 에러를 던진다', () => {
  assert.throws(() => buildGapSlots({ preset: 'unknown' }), /알 수 없는 프리셋/);
});
