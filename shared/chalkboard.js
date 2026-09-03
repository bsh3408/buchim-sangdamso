// shared/chalkboard.js — 코르크보드 + 포스트잇 시간표 렌더링
import { escapeHtml } from './escape.js';

const MODE_LABEL = { phone: '전화', in_person: '방문', both: '방문·전화' };

function methodTagsHtml(mode) {
  const modes = mode === 'both' ? ['in_person', 'phone'] : [mode];
  return `<div class="cb-methods">${modes.map(m => `<span class="cb-method-tag ${m === 'phone' ? 'm-phone' : 'm-visit'}">${MODE_LABEL[m]}</span>`).join('')}</div>`;
}

function addMinutesLocal(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** 학부모 시간표: 열림/예약됨/닫힘을 시각이 또렷이 보이는 한 줄짜리 목록으로 그린다.
 * (선생님 화면의 요일별 시간표와 같은 방식 — 칸마다 시작~종료 시각이 먼저 보인다.) */
export function renderParentSlotGrid(container, slots, handlers, durationMinutes) {
  container.innerHTML = '';
  container.classList.add('pt-slot-list');
  for (const slot of slots) {
    const el = document.createElement('div');
    el.dataset.slotId = slot.slot_id ?? '';
    el.dataset.startTime = slot.start_time;

    const filled = Boolean(slot.occupied);
    const open = Boolean(slot.is_open ?? true) && !filled;
    const start = slot.start_time.slice(0, 5);
    const end = addMinutesLocal(start, durationMinutes || 20);
    const timeHtml = `<span class="pt-slot-time">${start}<span class="pt-slot-time-end">~${end}</span></span>`;

    if (filled) {
      el.className = 'pt-slot-row pt-slot-row--booked';
      el.innerHTML = `${timeHtml}<div class="postit postit--row stuck">예약됨<small>눌러서 취소</small></div>`;
      el.addEventListener('click', () => handlers.onFilledClick?.(slot, el));
    } else if (open) {
      el.className = 'pt-slot-row pt-slot-row--open';
      el.innerHTML = `${timeHtml}${methodTagsHtml(slot.mode)}<span class="pt-slot-cta">신청하기 ›</span>`;
      el.addEventListener('click', () => handlers.onEmptyClick?.(slot, el));
    } else {
      el.className = 'pt-slot-row pt-slot-row--closed';
      el.innerHTML = `${timeHtml}<span class="pt-slot-status">마감</span>`;
    }

    container.appendChild(el);
  }
}

export function peelPostit(slotEl, onDone) {
  const postit = slotEl.querySelector('.postit');
  postit.classList.remove('stuck');
  postit.classList.add('peeling');
  setTimeout(() => {
    postit.classList.remove('peeling');
    postit.innerHTML = '';
    postit.style.pointerEvents = 'none';
    postit.style.opacity = '0';
    onDone?.();
  }, 550);
}

/** 슬롯을 교시 단위로 묶는다. "직접 설정"으로 만든 슬롯은 한 묶음, "방과후"로 추가한
 * 슬롯은 period_label로 별도 묶음이 된다(둘 다 period가 없어서 겹치면 안 되기 때문). */
export function groupByPeriod(slots) {
  const groups = [];
  const byKey = new Map();
  const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (const slot of sorted) {
    const key = slot.period_label ?? slot.period ?? 'custom';
    if (!byKey.has(key)) {
      const group = { period: slot.period, period_range: slot.period_range, period_label: slot.period_label, slots: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).slots.push(slot);
  }
  return groups;
}
