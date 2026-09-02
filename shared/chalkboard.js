// shared/chalkboard.js
import { escapeHtml } from './escape.js';

export function createSlotGrid(container, slots, handlers) {
  container.innerHTML = '';
  container.classList.add('cb-grid');
  for (const slot of slots) {
    const el = document.createElement('div');
    el.className = 'cb-slot';
    el.dataset.slotId = slot.slot_id ?? '';
    el.dataset.startTime = slot.start_time;

    const timeEl = document.createElement('span');
    timeEl.className = 'cb-time';
    timeEl.textContent = slot.start_time;
    el.appendChild(timeEl);

    const postit = document.createElement('div');
    postit.className = 'postit';
    el.appendChild(postit);

    if (slot.is_open === false) {
      el.classList.add('cb-slot--closed');
    }

    const filled = Boolean(slot.occupied);
    if (filled) {
      if (slot.booking_ref?.student_number) {
        postit.innerHTML = `${escapeHtml(slot.booking_ref.student_number)}번`;
      }
      postit.classList.add('stuck');
      postit.style.opacity = '1';
      postit.style.pointerEvents = 'auto';
    }

    el.addEventListener('click', () => {
      const isFilled = postit.classList.contains('stuck');
      if (isFilled) {
        handlers.onFilledClick?.(slot, el, postit);
      } else {
        handlers.onEmptyClick?.(slot, el, postit);
      }
    });

    container.appendChild(el);
  }
}

export function stickPostit(slotEl, labelHtml) {
  const postit = slotEl.querySelector('.postit');
  postit.innerHTML = labelHtml;
  postit.classList.remove('peeling');
  postit.classList.add('stuck');
  postit.style.pointerEvents = 'auto';
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
