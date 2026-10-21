/**
 * iGyan — Parent-Teacher Messaging Service
 * Conversations, messages, complaints, call logs
 */
import { supabase } from '../utils/supabase';

const err = (res, label) => {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
};

// Client-side membership check (defense-in-depth; real enforcement must be
// server-side RLS). Throws unless userId is the parent or teacher of the
// conversation.
async function assertParticipant(conversationId, userId) {
  if (!conversationId || !userId) throw new Error('Not authorized.');
  const res = await supabase
    .from('parent_teacher_conversations')
    .select('parent_id, teacher_id')
    .eq('id', conversationId)
    .single();
  if (res.error || !res.data) throw new Error('Conversation not found.');
  if (userId !== res.data.parent_id && userId !== res.data.teacher_id) {
    throw new Error('Not authorized to access this conversation.');
  }
  return res.data;
}

// ─── CONVERSATIONS ──────────────────────────────────────────

/** Get all conversations for a user (parent or teacher) */
export async function getConversations(userId, role) {
  const col = role === 'parent' ? 'parent_id' : 'teacher_id';
  const res = await supabase
    .from('parent_teacher_conversations')
    .select(`
      *,
      parent:users!ptc_parent_fkey(id, full_name, email, phone),
      teacher:users!ptc_teacher_fkey(id, full_name, email, phone),
      student:users!ptc_student_fkey(id, full_name, email)
    `)
    .eq(col, userId)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  return err(res, 'getConversations');
}

/** Create or get existing conversation */
export async function getOrCreateConversation({ schoolId, parentId, teacherId, studentId, classId }) {
  // Check if exists
  const existing = await supabase
    .from('parent_teacher_conversations')
    .select('id')
    .eq('school_id', schoolId)
    .eq('parent_id', parentId)
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (existing.data) return existing.data;

  const res = await supabase
    .from('parent_teacher_conversations')
    .insert({ school_id: schoolId, parent_id: parentId, teacher_id: teacherId, student_id: studentId, class_id: classId })
    .select()
    .single();
  return err(res, 'createConversation');
}

// ─── MESSAGES ───────────────────────────────────────────────

/** Get messages for a conversation (membership-verified when userId is given) */
export async function getMessages(conversationId, userId = null, limit = 50, offset = 0) {
  if (userId) await assertParticipant(conversationId, userId);
  const res = await supabase
    .from('parent_teacher_messages')
    .select(`
      *,
      sender:users!ptm_sender_fkey(id, full_name, email)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return err(res, 'getMessages');
}

/** Send a message */
export async function sendMessage({ conversationId, schoolId, senderId, senderRole, messageText, flag = 'general', flagLabel = null, repliedToId = null }) {
  await assertParticipant(conversationId, senderId);
  const res = await supabase
    .from('parent_teacher_messages')
    .insert({
      conversation_id: conversationId,
      school_id: schoolId,
      sender_id: senderId,
      sender_role: senderRole,
      message_text: messageText,
      flag,
      flag_label: flagLabel,
      replied_to_id: repliedToId,
    })
    .select()
    .single();
  const msg = err(res, 'sendMessage');

  // Update conversation last_message_at and unread count
  const unreadCol = senderRole === 'parent' ? 'unread_teacher' : 'unread_parent';
  try {
    // Increment unread count manually
    const { data: conv } = await supabase
      .from('parent_teacher_conversations')
      .select(unreadCol)
      .eq('id', conversationId)
      .single();
    const current = (conv && conv[unreadCol]) || 0;
    await supabase
      .from('parent_teacher_conversations')
      .update({ [unreadCol]: current + 1, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch (_) {
    // Fallback: just update timestamp
    await supabase
      .from('parent_teacher_conversations')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  return msg;
}

/** Mark messages as read for a conversation */
export async function markMessagesRead(conversationId, readerId, readerRole) {
  await assertParticipant(conversationId, readerId);
  const senderRole = readerRole === 'parent' ? 'faculty' : 'parent';
  await supabase
    .from('parent_teacher_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_role', senderRole)
    .eq('is_read', false);

  // Reset unread count
  const unreadCol = readerRole === 'parent' ? 'unread_parent' : 'unread_teacher';
  await supabase
    .from('parent_teacher_conversations')
    .update({ [unreadCol]: 0, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

/** Delete (soft) a message — only its sender may delete it */
export async function deleteMessage(messageId, userId) {
  if (!messageId || !userId) throw new Error('Not authorized.');
  const owner = await supabase
    .from('parent_teacher_messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();
  if (owner.error || !owner.data) throw new Error('Message not found.');
  if (owner.data.sender_id !== userId) {
    throw new Error('Not authorized to delete this message.');
  }
  const res = await supabase
    .from('parent_teacher_messages')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();
  return err(res, 'deleteMessage');
}

// ─── COMPLAINTS ─────────────────────────────────────────────

/** Get complaints (for parent or teacher) */
export async function getComplaints(userId, role) {
  const col = role === 'parent' ? 'parent_id' : 'teacher_id';
  const res = await supabase
    .from('parent_complaints')
    .select(`
      *,
      parent:users!pc_parent_fkey(id, full_name, email),
      student:users!pc_student_fkey(id, full_name),
      teacher:users!pc_teacher_fkey(id, full_name)
    `)
    .eq(col, userId)
    .order('created_at', { ascending: false });
  return err(res, 'getComplaints');
}

/** Create a complaint */
export async function createComplaint({ schoolId, parentId, studentId, teacherId, messageId, complaintType, subject, description, priority }) {
  const res = await supabase
    .from('parent_complaints')
    .insert({
      school_id: schoolId, parent_id: parentId, student_id: studentId,
      teacher_id: teacherId, message_id: messageId,
      complaint_type: complaintType || 'general',
      subject, description, priority: priority || 'medium',
    })
    .select()
    .single();
  return err(res, 'createComplaint');
}

/** Update complaint status (for teachers/admins) */
export async function updateComplaintStatus(complaintId, status, resolutionNotes) {
  const update = { status, updated_at: new Date().toISOString() };
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString();
    update.resolution_notes = resolutionNotes;
  }
  const res = await supabase.from('parent_complaints').update(update).eq('id', complaintId).select().single();
  return err(res, 'updateComplaintStatus');
}

// ─── CALL LOGS ──────────────────────────────────────────────

/** Get call logs for a conversation */
export async function getCallLogs(conversationId) {
  const res = await supabase
    .from('parent_teacher_call_logs')
    .select('*, caller:users!ptcl_caller_fkey(id, full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  return err(res, 'getCallLogs');
}

/** Request a callback */
export async function requestCallback({ conversationId, schoolId, callerId, callerRole, callType, scheduledAt, notes }) {
  const res = await supabase
    .from('parent_teacher_call_logs')
    .insert({
      conversation_id: conversationId, school_id: schoolId,
      caller_id: callerId, caller_role: callerRole,
      call_type: callType || 'callback_request',
      scheduled_at: scheduledAt, notes,
    })
    .select()
    .single();
  return err(res, 'requestCallback');
}

// ─── HELPERS ────────────────────────────────────────────────

/**
 * Get contacts available for starting a new chat.
 * - For parents: returns class teachers from faculty_profiles + their children from parent_student_assignments
 * - For faculty: returns parents of students (from parent_student_assignments) in their school
 */
export async function getAvailableContacts(userId, role, schoolId) {
  if (role === 'parent') {
    // 1) Get children
    const childrenRes = await supabase
      .from('parent_student_assignments')
      .select('id, student_id, relationship, student:users!psa_student_fkey(id, full_name, email)')
      .eq('parent_id', userId);
    const children = childrenRes.data || [];

    // 2) Get class teachers in the same school
    const teachersRes = await supabase
      .from('faculty_profiles')
      .select('user_id, name, class, section, department, phone, email')
      .eq('is_class_teacher', true);
    // Match to users table to get the user id & full_name
    const teacherUserIds = (teachersRes.data || []).map(t => t.user_id).filter(Boolean);
    let teacherUsers = [];
    if (teacherUserIds.length > 0) {
      const usersRes = await supabase.from('users').select('id, full_name, email, phone, school_id').in('id', teacherUserIds);
      teacherUsers = (usersRes.data || []).filter(u => !schoolId || u.school_id === schoolId);
    }
    // Merge faculty_profile info with user info
    const teachers = teacherUsers.map(u => {
      const fp = (teachersRes.data || []).find(t => t.user_id === u.id);
      return { ...u, className: fp?.class || '', section: fp?.section || '', department: fp?.department || '' };
    });

    return { children, teachers };
  }

  // Faculty flow — get parents from the school
  if (role === 'faculty') {
    // Get parent-student pairs in same school
    const parentsRes = await supabase
      .from('parent_student_assignments')
      .select('id, parent_id, student_id, relationship, parent:users!psa_parent_fkey(id, full_name, email, phone, school_id), student:users!psa_student_fkey(id, full_name, email)')
      .eq('parent.school_id', schoolId);
    const pairs = (parentsRes.data || []).filter(p => p.parent); // filter out null joins
    return { parents: pairs };
  }

  return {};
}
