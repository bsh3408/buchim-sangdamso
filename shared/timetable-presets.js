const PRESET_CLASS_MINUTES = { elementary: 40, middle: 45, high: 50 };

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toTimeString(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function sliceIntoSlots(startMinutes, endMinutes, consultMinutes) {
  const slots = [];
  for (let cursor = startMinutes; cursor < endMinutes; cursor += consultMinutes) {
    slots.push({ start_time: toTimeString(cursor), mode: 'both', is_open: false });
  }
  return slots;
}

// 한 교시(길이 classMinutes) 안에서만 상담 슬롯을 만든다. 첫 상담은 항상 교시 시작
// 시각부터 시작하고, 남는 시간은 상담 사이 여백으로 나눠 쓴다. 교시 사이 실제
// 쉬는시간은 여기서 절대 다루지 않는다(호출하는 쪽에서 breakMinutes로 건너뛴다).
export function slicePeriod(periodStartMinutes, classMinutes, consultMinutes, periodNumber) {
  const count = Math.floor(classMinutes / consultMinutes);
  if (count === 0) return [];
  const leftover = classMinutes - count * consultMinutes;
  const gap = count > 1 ? Math.floor(leftover / (count - 1)) : 0;
  const periodRange = `${toTimeString(periodStartMinutes)}~${toTimeString(periodStartMinutes + classMinutes)}`;
  const slots = [];
  let cursor = periodStartMinutes;
  for (let i = 0; i < count; i++) {
    slots.push({
      start_time: toTimeString(cursor),
      mode: 'both',
      is_open: false,
      period: periodNumber,
      period_range: periodRange,
    });
    cursor += consultMinutes + gap;
  }
  return slots;
}

export function buildPresetSlots({
  preset,
  startTime = '09:00',
  periodCount = 6,
  breakMinutes = 10,
  consultMinutes = 20,
}) {
  const classMinutes = PRESET_CLASS_MINUTES[preset];
  if (!classMinutes) {
    throw new Error(`알 수 없는 프리셋: ${preset}`);
  }
  let cursor = toMinutes(startTime);
  const slots = [];
  for (let period = 1; period <= periodCount; period++) {
    slots.push(...slicePeriod(cursor, classMinutes, consultMinutes, period));
    cursor += classMinutes + breakMinutes;
  }
  return slots;
}

export function buildCustomSlots({ startTime, endTime, consultMinutes }) {
  return sliceIntoSlots(toMinutes(startTime), toMinutes(endTime), consultMinutes);
}

export function buildAfterschoolSlots({ startTime, endTime, consultMinutes }) {
  return sliceIntoSlots(toMinutes(startTime), toMinutes(endTime), consultMinutes)
    .map(s => ({ ...s, period_label: '방과후' }));
}

/** 교시 하나의 시작 시각·길이를 바꿔서 그 교시의 상담 슬롯을 다시 만든다(교시 번호는 그대로). */
export function rebuildPeriod(startTime, classMinutes, consultMinutes, periodNumber) {
  return slicePeriod(toMinutes(startTime), classMinutes, consultMinutes, periodNumber);
}
