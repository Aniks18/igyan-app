/**
 * iGyan App - Voice chat history service (ported from igyan-mvp
 * /api/voice-chat GET/POST/DELETE on table `voice_chat_history`)
 */
import { supabase } from '../utils/supabase';

const err = (res, label) => {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
};

/** List all voice chats for a user, newest first. */
export async function listVoiceChats(userId) {
  if (!userId) throw new Error('User ID is required.');
  const res = await supabase
    .from('voice_chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return err(res, 'listVoiceChats');
}

/**
 * Create a new chat or update an existing one.
 * { userId, chatId?, title?, messages?, selectedNotes? }
 */
export async function saveVoiceChat({ userId, chatId, title, messages, selectedNotes }) {
  if (!userId) throw new Error('User ID is required.');
  const chatData = {
    user_id: userId,
    title: title || 'New Voice Chat',
    messages: messages || [],
    selected_notes: selectedNotes || null,
    updated_at: new Date().toISOString(),
  };
  if (chatId) {
    const res = await supabase
      .from('voice_chat_history')
      .update(chatData)
      .eq('id', chatId)
      .eq('user_id', userId)
      .select()
      .single();
    return err(res, 'saveVoiceChat');
  }
  const res = await supabase.from('voice_chat_history').insert(chatData).select().single();
  return err(res, 'saveVoiceChat');
}

/** Delete a chat owned by the user. */
export async function deleteVoiceChat({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('User ID and Chat ID are required.');
  const res = await supabase
    .from('voice_chat_history')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId);
  if (res.error) throw new Error(`deleteVoiceChat: ${res.error.message}`);
  return { success: true };
}
