// shared/timeline.js — 교시를 드래그로 옮기고, 오른쪽 끝을 드래그로 늘여
// 점심시간 같은 세부 시간을 조정하는 위젯.
function toTimeString(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const SNAP = 5;
function snap(v) { return Math.round(v / SNAP) * SNAP; }

/**
 * periods: [{ period, startMinutes, durationMinutes, locked, label }]
 * onChange(period, { startMinutes, durationMinutes }) — 드래그가 끝나고 실제로
 * 값이 바뀌었을 때만 호출된다.
 */
export function renderTimeline(container, periods, { dayStartMinutes, dayEndMinutes, onChange }) {
  const total = dayEndMinutes - dayStartMinutes;
  container.innerHTML = `
    <div class="tl-ruler" id="tlRuler"></div>
    <div class="tl-hint">칸을 눌러 옆으로 끌면 시작 시각이 바뀌고, 오른쪽 끝을 끌면 길이가 바뀌어요 (점심시간은 그 사이를 벌려서 만들어요).</div>
  `;
  const ruler = container.querySelector('#tlRuler');

  const sorted = [...periods].sort((a, b) => a.startMinutes - b.startMinutes);

  function neighborBounds(idx) {
    const prevEnd = idx > 0 ? sorted[idx - 1].startMinutes + sorted[idx - 1].durationMinutes : dayStartMinutes;
    const nextStart = idx < sorted.length - 1 ? sorted[idx + 1].startMinutes : dayEndMinutes;
    return { prevEnd, nextStart };
  }

  function draw() {
    ruler.innerHTML = '';
    sorted.forEach((p, idx) => {
      const left = ((p.startMinutes - dayStartMinutes) / total) * 100;
      const width = (p.durationMinutes / total) * 100;
      const block = document.createElement('div');
      block.className = 'tl-block' + (p.locked ? ' tl-block--locked' : '');
      block.style.left = `${left}%`;
      block.style.width = `${width}%`;
      block.innerHTML = `
        <div class="tl-block-label">${p.label ?? p.period + '교시'}</div>
        <div class="tl-block-time">${toTimeString(p.startMinutes)}~${toTimeString(p.startMinutes + p.durationMinutes)}</div>
        ${p.locked ? '' : '<div class="tl-resize-handle"></div>'}
      `;
      ruler.appendChild(block);

      if (p.locked) return;

      const timeEl = block.querySelector('.tl-block-time');

      block.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.tl-resize-handle')) return;
        e.preventDefault();
        try { block.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 등 캡처 불가 시 무시 */ }
        const rulerWidth = ruler.getBoundingClientRect().width;
        const minutesPerPx = total / rulerWidth;
        const startX = e.clientX;
        const originalStart = p.startMinutes;
        const { prevEnd, nextStart } = neighborBounds(idx);
        const onMove = (mv) => {
          const deltaMin = snap((mv.clientX - startX) * minutesPerPx);
          let newStart = originalStart + deltaMin;
          newStart = Math.max(prevEnd, Math.min(newStart, nextStart - p.durationMinutes));
          p.startMinutes = newStart;
          block.style.left = `${((newStart - dayStartMinutes) / total) * 100}%`;
          timeEl.textContent = `${toTimeString(newStart)}~${toTimeString(newStart + p.durationMinutes)}`;
        };
        const onUp = () => {
          block.removeEventListener('pointermove', onMove);
          block.removeEventListener('pointerup', onUp);
          if (p.startMinutes !== originalStart) {
            onChange?.(p.period, { startMinutes: p.startMinutes, durationMinutes: p.durationMinutes });
          }
        };
        block.addEventListener('pointermove', onMove);
        block.addEventListener('pointerup', onUp);
      });

      const handle = block.querySelector('.tl-resize-handle');
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 등 캡처 불가 시 무시 */ }
        const rulerWidth = ruler.getBoundingClientRect().width;
        const minutesPerPx = total / rulerWidth;
        const startX = e.clientX;
        const originalDuration = p.durationMinutes;
        const { nextStart } = neighborBounds(idx);
        const minDuration = 10;
        const onMove = (mv) => {
          const deltaMin = snap((mv.clientX - startX) * minutesPerPx);
          let newDuration = originalDuration + deltaMin;
          newDuration = Math.max(minDuration, Math.min(newDuration, nextStart - p.startMinutes));
          p.durationMinutes = newDuration;
          block.style.width = `${(newDuration / total) * 100}%`;
          timeEl.textContent = `${toTimeString(p.startMinutes)}~${toTimeString(p.startMinutes + newDuration)}`;
        };
        const onUp = () => {
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          if (p.durationMinutes !== originalDuration) {
            onChange?.(p.period, { startMinutes: p.startMinutes, durationMinutes: p.durationMinutes });
          }
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
      });
    });
  }

  draw();
}
