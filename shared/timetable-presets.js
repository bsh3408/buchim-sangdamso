const PRESET_CLASS_MINUTES = { middle: 45, high: 50 };

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
  const startMinutes = toMinutes(startTime);
  const endMinutes = startMinutes + periodCount * (classMinutes + breakMinutes);
  return sliceIntoSlots(startMinutes, endMinutes, consultMinutes);
}

export function buildCustomSlots({ startTime, endTime, consultMinutes }) {
  return sliceIntoSlots(toMinutes(startTime), toMinutes(endTime), consultMinutes);
}
