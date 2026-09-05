// shared/db.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

async function rpc(fnName, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || `요청이 실패했어요 (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const db = {
  getOrCreateTeacher: (name, adminCode, school, schoolLevel, grade, teacherClass) =>
    rpc('get_or_create_teacher', {
      p_name: name, p_admin_code: adminCode, p_school: school, p_school_level: schoolLevel,
      p_grade: grade, p_class: teacherClass,
    }),
  teacherLogin: (name, adminCode) =>
    rpc('teacher_login', { p_name: name, p_admin_code: adminCode }),
  getTeacherSchedule: (pageId, adminCode) =>
    rpc('get_teacher_schedule', { p_page_id: pageId, p_admin_code: adminCode }),
  saveDateSlots: (pageId, adminCode, date, preset, durationMinutes, slots, audience = 'parent') =>
    rpc('save_date_slots', {
      p_page_id: pageId, p_admin_code: adminCode, p_date: date,
      p_preset: preset, p_duration_minutes: durationMinutes, p_slots: slots, p_audience: audience,
    }),
  publishPage: (pageId, adminCode) =>
    rpc('publish_page', { p_page_id: pageId, p_admin_code: adminCode }),
  getPublicSchedule: (parentCode, audience = 'parent') =>
    rpc('get_public_schedule', { p_parent_code: parentCode, p_audience: audience }),
  bookSlot: (parentCode, slotId, studentNumber, studentName, className, parentName, parentPhone, topics, notes, mode) =>
    rpc('book_slot', {
      p_parent_code: parentCode, p_slot_id: slotId,
      p_student_number: studentNumber, p_student_name: studentName, p_class_name: className,
      p_parent_name: parentName, p_parent_phone: parentPhone,
      p_topics: topics, p_notes: notes, p_mode: mode,
    }),
  cancelBooking: (cancelToken, phone) =>
    rpc('cancel_booking', { p_cancel_token: cancelToken, p_phone: phone }),
  teacherCancelBooking: (pageId, adminCode, slotId) =>
    rpc('teacher_cancel_booking', { p_page_id: pageId, p_admin_code: adminCode, p_slot_id: slotId }),
  deleteScheduleDate: (pageId, adminCode, date) =>
    rpc('delete_schedule_date', { p_page_id: pageId, p_admin_code: adminCode, p_date: date }),
};
