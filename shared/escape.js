// 학부모가 직접 입력한 값(학생 이름 등)을 innerHTML에 넣기 전 반드시 거친다.
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
