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
  getOrCreateTeacher: (name, adminCode, school, schoolLevel, grade, teacherClass, securityQuestionId, securityAnswer) =>
    rpc('get_or_create_teacher', {
      p_name: name, p_admin_code: adminCode, p_school: school, p_school_level: schoolLevel,
      p_grade: grade, p_class: teacherClass,
      p_security_question_id: securityQuestionId ?? null,
      p_security_answer: securityAnswer || null,
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
  createQnaPost: (parentCode, authorName, title, content, accessCode) =>
    rpc('create_qna_post', {
      p_parent_code: parentCode, p_author_name: authorName,
      p_title: title, p_content: content, p_access_code: accessCode,
    }),
  getMyQnaPosts: (parentCode, authorName, accessCode) =>
    rpc('get_my_qna_posts', {
      p_parent_code: parentCode, p_author_name: authorName, p_access_code: accessCode,
    }),
  getTeacherQnaList: (pageId, adminCode) =>
    rpc('get_teacher_qna_list', { p_page_id: pageId, p_admin_code: adminCode }),
  answerQnaPost: (pageId, adminCode, postId, answer) =>
    rpc('answer_qna_post', { p_page_id: pageId, p_admin_code: adminCode, p_post_id: postId, p_answer: answer }),
  deleteQnaPost: (pageId, adminCode, postId) =>
    rpc('delete_qna_post', { p_page_id: pageId, p_admin_code: adminCode, p_post_id: postId }),
  changeOwnPassword: (pageId, adminCode, newPassword) =>
    rpc('change_own_password', { p_page_id: pageId, p_admin_code: adminCode, p_new_password: newPassword }),
  getSecurityQuestion: (name, schoolLevel, school, grade, teacherClass) =>
    rpc('get_security_question', {
      p_name: name, p_school_level: schoolLevel, p_school: school, p_grade: grade, p_class: teacherClass,
    }),
  resetPasswordByAnswer: (name, schoolLevel, school, grade, teacherClass, answer, newPassword) =>
    rpc('reset_password_by_answer', {
      p_name: name, p_school_level: schoolLevel, p_school: school, p_grade: grade, p_class: teacherClass,
      p_answer: answer, p_new_password: newPassword,
    }),
  setSecurityQuestion: (pageId, adminCode, questionId, answer) =>
    rpc('set_security_question', {
      p_page_id: pageId, p_admin_code: adminCode,
      p_question_id: questionId ?? null, p_answer: answer || null,
    }),
};
