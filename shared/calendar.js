// shared/calendar.js — 네이버 예약처럼 달력에서 날짜를 눌러 기간을 고르는 위젯
function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * container 안에 달력을 그린다. 시작일을 먼저 누르고, 그 다음 종료일을 누르면
 * onRangeConfirmed(startStr, endStr)가 호출된다. 같은 날을 두 번 누르면 하루짜리
 * 기간으로 확정된다. 이미 확정된 상태에서 다시 누르면 새 시작일로 다시 시작한다.
 */
export function renderCalendar(container, { onRangeConfirmed } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let start = null; // 'YYYY-MM-DD'
  let end = null;
  let confirmed = false;

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
      let cls = 'cal-day';
      if (dow === 0) cls += ' sun'; else if (dow === 6) cls += ' sat';
      if (isPast) cls += ' cal-day--past';
      if (isToday) cls += ' cal-day--today';
      if (start && dateStr === start) cls += ' cal-day--start';
      if (end && dateStr === end) cls += ' cal-day--end';
      if (start && end && dateStr > start && dateStr < end) cls += ' cal-day--in-range';
      return `<div class="cal-day" data-date="${dateStr}"><button type="button" class="${cls}" ${isPast ? 'disabled' : ''} data-date="${dateStr}">${d}</button></div>`;
    }).join('');

    container.innerHTML = `
      <div class="cal-widget">
        <div class="cal-header">
          <button type="button" class="cal-nav-btn" id="calPrev">‹</button>
          <strong>${viewYear}년 ${viewMonth + 1}월</strong>
          <button type="button" class="cal-nav-btn" id="calNext">›</button>
        </div>
        <div class="cal-grid">${dowHtml}${cellsHtml}</div>
        <div class="cal-hint">${
          !start ? '시작일을 눌러주세요' : !end ? '종료일을 눌러주세요 (같은 날을 다시 누르면 하루만 선택돼요)' : `${start} ~ ${end}`
        }</div>
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
      btn.addEventListener('click', () => onDayClick(btn.dataset.date));
    });
  }

  function onDayClick(dateStr) {
    if (!start || confirmed) {
      start = dateStr; end = null; confirmed = false;
      draw();
      return;
    }
    if (dateStr < start) {
      start = dateStr;
      draw();
      return;
    }
    end = dateStr;
    confirmed = true;
    draw();
    onRangeConfirmed?.(start, end);
  }

  draw();
}
