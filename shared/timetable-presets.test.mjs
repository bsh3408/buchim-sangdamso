import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPresetSlots, buildCustomSlots } from './timetable-presets.js';

test('중학교형은 09:00부터 45분 교시 기준 구간을 20분 단위로 자른다', () => {
  const slots = buildPresetSlots({ preset: 'middle', periodCount: 1, breakMinutes: 0, consultMinutes: 20 });
  assert.deepEqual(slots.map(s => s.start_time), ['09:00', '09:20', '09:40']);
  assert.equal(slots.every(s => s.mode === 'both' && s.is_open === false), true);
});

test('고등학교형은 50분 교시 기준이라 중학교형보다 슬롯이 하나 더 나온다', () => {
  const middle = buildPresetSlots({ preset: 'middle', periodCount: 1, breakMinutes: 0, consultMinutes: 20 });
  const high = buildPresetSlots({ preset: 'high', periodCount: 1, breakMinutes: 0, consultMinutes: 20 });
  assert.ok(high.length >= middle.length);
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
