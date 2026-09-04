// shared/calendar.js — 달력에서 날짜를 눌러 켜고, 다시 누르면 끄는 위젯(개별 선택)
function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * container 안에 달력을 그린다. 날짜를 누르면 onToggleDate(dateStr)가 호출된다.
 * 이미 선택된 날짜(selectedDates에 포함)를 다시 누르면 빼는 동작은 호출하는 쪽에서
 * onToggleDate 안에서 처리한다(이 위젯은 선택 상태를 직접 들고 있지 않는다).
 */
export function renderCalendar(container, { onToggleDate, selectedDates } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Set(selectedDates || []);
  const sortedSelected = [...selected].sort();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  if (sortedSelected.length > 0) {
    const [fy, fm] = sortedSelected[0].split('-').map(Number);
    viewYear = fy; viewMonth = fm - 1;
  }

  function draw() {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const dowNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dowHtml = dowNames.map((n, i) =>
      `<div class="cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${n}</div>`
    ).join('');

    const cellsHtml = cells.map((d) => {
      if (d === null) return `<div class="cal-day cal-day--empty"></div>`;
      const dateStr = fmt(viewYear, viewMonth, d);
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const isPast = dateStr < fmt(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = dateStr === fmt(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dow === 0 || dow === 6;
      const isDisabled = isPast || isWeekend;
      let cls = 'cal-day';
      if (dow === 0) cls += ' sun'; else if (dow === 6) cls += ' sat';
      if (isPast) cls += ' cal-day--past';
      else if (isWeekend) cls += ' cal-day--weekend-off';
      if (isToday) cls += ' cal-day--today';
      if (selected.has(dateStr)) cls += ' cal-day--selected';
      return `<div class="cal-day" data-date="${dateStr}"><button type="button" class="${cls}" ${isDisabled ? 'disabled' : ''} data-date="${dateStr}">${d}</button></div>`;
    }).join('');

    container.innerHTML = `
      <div class="cal-widget">
        <div class="cal-header">
          <button type="button" class="cal-nav-btn" id="calPrev">‹</button>
          <strong>${viewYear}년 ${viewMonth + 1}월</strong>
          <button type="button" class="cal-nav-btn" id="calNext">›</button>
        </div>
        <div class="cal-grid">${dowHtml}${cellsHtml}</div>
        <div class="cal-hint">날짜를 눌러서 추가하고, 다시 누르면 빠져요${selected.size > 0 ? ` (${selected.size}일 선택됨)` : ''}</div>
        <div class="cal-hint">주말(토·일)은 상담일로 고를 수 없어요</div>
      </div>
    `;

    container.querySelector('#calPrev').addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      draw();
    });
    container.querySelector('#calNext').addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      draw();
    });
    container.querySelectorAll('.cal-day[data-date] button').forEach((btn) => {
      btn.addEventListener('click', () => onToggleDate?.(btn.dataset.date));
    });
  }

  draw();
}

/**
 * container 안에 달력을 그린다. availableDates에 있는 날짜만 고를 수 있고(그 외에는
 * 비활성), 한 번에 하나만 선택된다(라디오 방식). 날짜를 누르면 onSelectDate(dateStr)가
 * 호출된다 — 학부모가 상담 가능한 날짜를 고르는 화면 전용.
 */
export function renderParentCalendar(container, { availableDates, selectedDate, onSelectDate } = {}) {
  const avail = new Set(availableDates || []);
  const sorted = [...avail].sort();
  const base = selectedDate || sorted[0];
  let viewYear, viewMonth;
  if (base) {
    const [y, m] = base.split('-').map(Number);
    viewYear = y; viewMonth = m - 1;
  } else {
    const today = new Date();
    viewYear = today.getFullYear(); viewMonth = today.getMonth();
  }

  function draw() {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const dowNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dowHtml = dowNames.map((n, i) =>
      `<div class="cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${n}</div>`
    ).join('');

    const cellsHtml = cells.map((d) => {
      if (d === null) return `<div class="cal-day cal-day--empty"></div>`;
      const dateStr = fmt(viewYear, viewMonth, d);
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const isAvail = avail.has(dateStr);
      let cls = 'cal-day';
      if (dow === 0) cls += ' sun'; else if (dow === 6) cls += ' sat';
      if (isAvail) cls += ' cal-day--avail';
      if (dateStr === selectedDate) cls += ' cal-day--selected';
      return `<div class="cal-day" data-date="${dateStr}"><button type="button" class="${cls}" ${isAvail ? '' : 'disabled'} data-date="${dateStr}">${d}</button></div>`;
    }).join('');

    container.innerHTML = `
      <div class="cal-widget">
        <div class="cal-header">
          <button type="button" class="cal-nav-btn" id="calPrev">‹</button>
          <strong>${viewYear}년 ${viewMonth + 1}월</strong>
          <button type="button" class="cal-nav-btn" id="calNext">›</button>
        </div>
        <div class="cal-grid">${dowHtml}${cellsHtml}</div>
        <div class="cal-hint">${avail.size === 0 ? '상담 가능한 날짜가 없어요' : '점이 있는 날짜에서 상담을 신청할 수 있어요'}</div>
      </div>
    `;

    container.querySelector('#calPrev').addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      draw();
    });
    container.querySelector('#calNext').addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      draw();
    });
    container.querySelectorAll('.cal-day--avail').forEach((btn) => {
      btn.addEventListener('click', () => onSelectDate?.(btn.dataset.date));
    });
  }

  draw();
}
