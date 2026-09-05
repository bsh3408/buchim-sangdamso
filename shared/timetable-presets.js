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
function slicePeriod(periodStartMinutes, classMinutes, consultMinutes, periodNumber) {
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
  lunchAfterPeriod = null,
  lunchMinutes = 50,
}) {
  const classMinutes = PRESET_CLASS_MINUTES[preset];
  if (!classMinutes) {
    throw new Error(`알 수 없는 프리셋: ${preset}`);
  }
  let cursor = toMinutes(startTime);
  const slots = [];
  for (let period = 1; period <= periodCount; period++) {
    slots.push(...slicePeriod(cursor, classMinutes, consultMinutes, period));
    const gap = period === lunchAfterPeriod ? lunchMinutes : breakMinutes;
    cursor += classMinutes + gap;
  }
  return slots;
}

export function buildCustomSlots({ startTime, endTime, consultMinutes }) {
  return sliceIntoSlots(toMinutes(startTime), toMinutes(endTime), consultMinutes);
}

// 학생 상담은 교과시간(교시)을 쓸 수 없어서, buildPresetSlots가 여백으로 건너뛰는
// 쉬는시간·점심시간 구간에서만 슬롯을 만든다. 마지막 교시 뒤 쉬는시간은 방과후와
// 겹치는 시간대라 여기서 만들지 않는다(방과후는 별도 buildAfterschoolSlots로 정한다).
export function buildGapSlots({
  preset,
  startTime = '09:00',
  periodCount = 6,
  breakMinutes = 10,
  consultMinutes = 10,
  lunchAfterPeriod = null,
  lunchMinutes = 50,
}) {
  const classMinutes = PRESET_CLASS_MINUTES[preset];
  if (!classMinutes) {
    throw new Error(`알 수 없는 프리셋: ${preset}`);
  }
  let cursor = toMinutes(startTime);
  const slots = [];
  for (let period = 1; period <= periodCount; period++) {
    cursor += classMinutes;
    const isLunch = period === lunchAfterPeriod;
    const gapMinutes = isLunch ? lunchMinutes : breakMinutes;
    if (isLunch || period < periodCount) {
      const label = isLunch ? '점심시간' : `쉬는시간(${period}교시~${period + 1}교시)`;
      const gapRange = `${toTimeString(cursor)}~${toTimeString(cursor + gapMinutes)}`;
      slots.push(...sliceIntoSlots(cursor, cursor + gapMinutes, consultMinutes)
        .map(s => ({ ...s, period, period_range: gapRange, period_label: label })));
    }
    cursor += gapMinutes;
  }
  return slots;
}

export function buildAfterschoolSlots({ startTime, endTime, consultMinutes }) {
  return sliceIntoSlots(toMinutes(startTime), toMinutes(endTime), consultMinutes)
    .map(s => ({ ...s, period_label: '방과후' }));
}
