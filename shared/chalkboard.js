// shared/chalkboard.js — 칠판 + 포스트잇 시간표 렌더링
import { escapeHtml } from './escape.js';

const MODE_LABEL = { phone: '전화', in_person: '방문', both: '방문·전화' };

function methodTagsHtml(mode) {
  const modes = mode === 'both' ? ['in_person', 'phone'] : [mode];
  return `<div class="cb-methods">${modes.map(m => `<span class="cb-method-tag">${MODE_LABEL[m]}</span>`).join('')}</div>`;
}

/** 학부모 시간표: 열림/예약됨/닫힘 3가지 상태로 칠판 칸을 그린다. */
export function renderParentSlotGrid(container, slots, handlers) {
  container.innerHTML = '';
  container.classList.add('cb-grid');
  for (const slot of slots) {
    const el = document.createElement('div');
    el.className = 'cb-slot';
    el.dataset.slotId = slot.slot_id ?? '';
    el.dataset.startTime = slot.start_time;

    const filled = Boolean(slot.occupied);
    const open = Boolean(slot.is_open ?? true) && !filled;

    if (filled) {
      const label = slot.booking_ref?.student_number ? `${escapeHtml(slot.booking_ref.student_number)}번` : '';
      el.innerHTML = `<span class="cb-time">${slot.start_time.slice(0, 5)}</span><div class="postit stuck">${label}</div>`;
      el.addEventListener('click', () => handlers.onFilledClick?.(slot, el));
    } else if (open) {
      el.classList.add('cb-slot--open');
      el.innerHTML = `<span class="cb-time">${slot.start_time.slice(0, 5)}</span>${methodTagsHtml(slot.mode)}<div class="postit"></div>`;
      el.addEventListener('click', () => handlers.onEmptyClick?.(slot, el));
    } else {
      el.classList.add('cb-slot--closed');
      el.innerHTML = `<span class="cb-time">${slot.start_time.slice(0, 5)}</span><div class="postit"></div>`;
    }

    container.appendChild(el);
  }
}

/** 담임 설정 화면: 칸을 누르면 열림/닫힘 토글, 방법 뱃지를 누르면 방문/전화 토글. */
export function renderEditingSlotGrid(container, slots, handlers) {
  container.innerHTML = '';
  container.classList.add('cb-grid');
  for (const slot of slots) {
    const el = document.createElement('div');
    el.className = 'cb-slot editing';
    el.dataset.slotId = slot.slot_id ?? '';

    if (slot.booking) {
      el.classList.add('cb-slot--closed');
      el.innerHTML = `
        <span class="cb-time">${slot.start_time.slice(0, 5)}</span>
        <div class="postit stuck">${escapeHtml(slot.booking.student_number)}번</div>
      `;
      container.appendChild(el);
      continue;
    }

    if (slot.is_open) el.classList.add('cb-slot--open');
    else el.classList.add('cb-slot--off');

    const modes = slot.mode === 'both' ? ['in_person', 'phone'] : slot.mode ? [slot.mode] : ['in_person', 'phone'];
    el.innerHTML = `
      <span class="cb-time">${slot.start_time.slice(0, 5)}</span>
      <div class="cb-method-checks">
        <span class="cb-method-check ${modes.includes('in_person') ? 'on' : ''}" data-m="in_person">방문</span>
        <span class="cb-method-check ${modes.includes('phone') ? 'on' : ''}" data-m="phone">전화</span>
      </div>
    `;
    el.addEventListener('click', (e) => {
      const checkEl = e.target.closest('.cb-method-check');
      if (checkEl) {
        e.stopPropagation();
        handlers.onMethodToggle?.(slot, checkEl.dataset.m);
      } else {
        handlers.onToggleOpen?.(slot);
      }
    });
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

/** 슬롯을 교시 단위로 묶는다("직접 설정"으로 만든 슬롯은 period가 없어 한 묶음이 된다). */
export function groupByPeriod(slots) {
  const groups = [];
  const byKey = new Map();
  for (const slot of slots) {
    const key = slot.period ?? 'custom';
    if (!byKey.has(key)) {
      const group = { period: slot.period, period_range: slot.period_range, slots: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).slots.push(slot);
  }
  return groups;
}
