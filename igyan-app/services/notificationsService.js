/**
 * iGyan App - Notifications service (ported from igyan-mvp
 * /api/notifications/app, /sms, and /trigger-attendance)
 *
 * The reference triggers downstream HTTP calls to its own routes; here the
 * service layer calls the primitives directly. SMS goes through Twilio or
 * MSG91 and requires provider credentials — nothing is sent silently.
 */
import { supabase } from '../utils/supabase';

const SMS_PROVIDER = process.env.EXPO_PUBLIC_SMS_PROVIDER;

function smsConfigError() {
  return new Error(
    'SMS provider is not configured. Set EXPO_PUBLIC_SMS_PROVIDER (twilio|msg91) plus provider credentials.',
  );
}

async function sendViaTwilio(to, message) {
  const accountSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
  const authToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) throw smsConfigError();
  const params = new URLSearchParams({ To: to, From: fromNumber, Body: message });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      // btoa ships with Hermes/JSC; sid + token are always ASCII.
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!response.ok) {
    let detail = 'Unknown error';
    try {
      detail = (await response.json()).message || detail;
    } catch {
      detail = `HTTP ${response.status}`;
    }
    throw new Error(`Twilio error: ${detail}`);
  }
  return response.json();
}

async function sendViaMsg91(to, message) {
  const authKey = process.env.EXPO_PUBLIC_MSG91_AUTH_KEY;
  const senderId = process.env.EXPO_PUBLIC_MSG91_SENDER_ID;
  const templateId = process.env.EXPO_PUBLIC_MSG91_TEMPLATE_ID;
  if (!authKey || !senderId) throw smsConfigError();
  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: authKey },
    body: JSON.stringify({
      sender: senderId,
      flow_id: templateId,
      mobiles: to,
      message,
    }),
  });
  if (!response.ok) throw new Error(`MSG91 error: HTTP ${response.status}.`);
  return response.json();
}

/** Send one SMS through the configured provider. */
export async function sendSms(to, message) {
  if (!to || !message) throw new Error('Recipient and message are required.');
  if (SMS_PROVIDER === 'twilio') return sendViaTwilio(to, message);
  if (SMS_PROVIDER === 'msg91') return sendViaMsg91(to, message);
  throw smsConfigError();
}

// ─── In-app notifications (table `notifications`) ───

/**
 * Create in-app notifications for a list of users.
 * { type, userIds, title, message, priority, actionUrl, data }
 */
export async function createAppNotifications({
  type = 'general',
  userIds,
  title,
  message,
  priority = 'medium',
  actionUrl,
  data,
} = {}) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('User IDs array is required.');
  }
  if (!title || !message) throw new Error('Title and message are required.');
  const { data: inserted, error } = await supabase
    .from('notifications')
    .insert(
      userIds.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        priority,
        action_url: actionUrl,
        data: data ? JSON.stringify(data) : null,
        is_read: false,
        created_at: new Date().toISOString(),
      })),
    )
    .select();
  if (error) throw new Error(`createAppNotifications: ${error.message}`);
  return { success: true, message: `Created ${inserted.length} notifications.`, data: inserted };
}

/** List a user's notifications, newest first. */
export async function listNotifications(userId, { limit = 50 } = {}) {
  if (!userId) throw new Error('User ID is required.');
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listNotifications: ${error.message}`);
  return data || [];
}

/** Mark one notification as read (ownership enforced). */
export async function markNotificationRead(userId, notificationId) {
  if (!userId || !notificationId) throw new Error('User ID and notification ID are required.');
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw new Error(`markNotificationRead: ${error.message}`);
  return { success: true };
}

// ─── Attendance triggers ───

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Fetch absent records (with student + parent info) for a date. */
export async function getAbsentStudents({ schoolId, classId, sectionId, date } = {}) {
  const targetDate = date || todayISO();
  if (!schoolId) throw new Error('schoolId is required.');
  const { data, error } = await supabase
    .from('attendance')
    .select('*, students (id, full_name, class, section, parent_phone, parent_email, parent_user_id)')
    .eq('date', targetDate)
    .eq('status', 'absent')
    .eq('school_id', schoolId);
  if (error) throw new Error(`getAbsentStudents: ${error.message}`);
  let rows = data || [];
  if (classId) rows = rows.filter((r) => r.students?.class === classId);
  if (sectionId) rows = rows.filter((r) => r.students?.section === sectionId);
  return { date: targetDate, rows };
}

/**
 * Send absence alerts to parents of absent students (SMS + in-app).
 * Returns a details summary; per-channel results are attached.
 */
export async function sendAbsenceAlerts({ schoolId, classId, sectionId, date } = {}) {
  const { date: targetDate, rows } = await getAbsentStudents({ schoolId, classId, sectionId, date });
  if (rows.length === 0) return { success: true, message: 'No absent students found.', sent: 0 };

  const { data: school } = await supabase.from('schools').select('school_name').eq('id', schoolId).single();
  const schoolName = school?.school_name || 'School';

  const smsRecipients = [];
  const appUserIds = [];
  for (const record of rows) {
    if (record.students?.parent_phone) smsRecipients.push(record.students.parent_phone);
    if (record.students?.parent_user_id) appUserIds.push(record.students.parent_user_id);
  }

  const results = { sms: [], app: null };
  for (const phone of smsRecipients) {
    try {
      await sendSms(phone, `${schoolName}: Your child was marked absent on ${targetDate}. Contact the class teacher if this is an error.`);
      results.sms.push({ phone, ok: true });
    } catch (error) {
      results.sms.push({ phone, ok: false, error: error.message });
    }
  }
  if (appUserIds.length > 0) {
    results.app = await createAppNotifications({
      type: 'absence_alert',
      userIds: appUserIds,
      title: 'Absence Alert',
      message: 'Your child was marked absent today. If this is an error, please contact the class teacher.',
      priority: 'high',
      data: { date: targetDate },
    });
  }
  return {
    success: true,
    message: `Sent ${rows.length} absence alerts.`,
    details: { totalAbsent: rows.length, smsSent: results.sms.filter((r) => r.ok).length, appNotifications: appUserIds.length },
    results,
  };
}

/** Per-student weekly attendance stats + recipient lists for a school. */
export async function getWeeklyReportData({ schoolId } = {}) {
  if (!schoolId) throw new Error('schoolId is required.');
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const startDate = start.toISOString().split('T')[0];

  const { data: students, error } = await supabase.from('students').select('*').eq('school_id', schoolId);
  if (error) throw new Error(`getWeeklyReportData: ${error.message}`);
  const stats = [];
  for (const student of students || []) {
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', student.id)
      .gte('date', startDate)
      .lte('date', endDate);
    const totalDays = attendanceData?.length || 0;
    const presentDays = attendanceData?.filter((a) => a.status === 'present').length || 0;
    stats.push({
      student,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    });
  }
  return { startDate, endDate, stats };
}

/** Send weekly attendance reports to parents (SMS capped at 100, like the reference). */
export async function sendWeeklyReports({ schoolId } = {}) {
  const { startDate, endDate, stats } = await getWeeklyReportData({ schoolId });
  if (stats.length === 0) return { success: true, message: 'No students found.' };

  const smsRecipients = stats.filter((s) => s.student.parent_phone).map((s) => s.student.parent_phone);
  const appUserIds = stats.filter((s) => s.student.parent_user_id).map((s) => s.student.parent_user_id);

  const results = { sms: [], app: null };
  for (const phone of smsRecipients.slice(0, 100)) {
    try {
      await sendSms(phone, `Weekly attendance report (${startDate} to ${endDate}) is now available.`);
      results.sms.push({ phone, ok: true });
    } catch (error) {
      results.sms.push({ phone, ok: false, error: error.message });
    }
  }
  if (appUserIds.length > 0) {
    results.app = await createAppNotifications({
      type: 'weekly_report',
      userIds: appUserIds,
      title: 'Weekly Attendance Report',
      message: "Your child's attendance report for the week is now available.",
      priority: 'medium',
      data: { startDate, endDate },
    });
  }
  return {
    success: true,
    message: `Sent ${stats.length} weekly reports.`,
    details: { totalStudents: stats.length, smsSent: results.sms.filter((r) => r.ok).length, appNotifications: appUserIds.length, period: `${startDate} to ${endDate}` },
    results,
  };
}
