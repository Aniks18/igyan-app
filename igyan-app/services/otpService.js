/**
 * iGyan App - OTP service (ported from igyan-mvp /api/otp/send and
 * /api/otp/verify on table `otp_records`, delivery via WhatsApp)
 */
import { supabase } from '../utils/supabase';
import { cleanPhone, generateOTP, formatWhatsAppReceiver, remainingAttemptsText } from './apiUtils';

const WHATSAPP_API_URL =
  process.env.EXPO_PUBLIC_WHATSAPP_API_URL ||
  'https://adminapis.backendprod.com/lms_campaign/api/whatsapp/template/h908xvdkc3/process';

const OTP_TTL_MINUTES = 10;
const MAX_OTPS_PER_HOUR = 5;

/**
 * Generate an OTP and send it over WhatsApp.
 * Returns { success, message, phone }.
 */
export async function requestOtp({ phone, reason = 'registration' } = {}) {
  if (!phone) throw new Error('Phone number is required.');
  const cleanedPhone = cleanPhone(phone);
  if (cleanedPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Rate limit: max 5 OTPs per phone per hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentOtps } = await supabase
    .from('otp_records')
    .select('id')
    .eq('phone', cleanedPhone)
    .gte('created_at', oneHourAgo);
  if (recentOtps && recentOtps.length >= MAX_OTPS_PER_HOUR) {
    throw new Error('Too many OTP requests. Please try again after some time.');
  }

  // Expire previous unverified OTPs for this phone + reason.
  await supabase
    .from('otp_records')
    .update({ expires_at: new Date().toISOString() })
    .eq('phone', cleanedPhone)
    .eq('reason', reason)
    .eq('is_verified', false);

  const otpCode = generateOTP();
  const { error: insertErr } = await supabase.from('otp_records').insert({
    phone: cleanedPhone,
    otp_code: otpCode,
    reason,
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
  });
  if (insertErr) throw new Error('Failed to generate OTP.');

  let response;
  try {
    response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver: formatWhatsAppReceiver(cleanedPhone), values: { 1: otpCode } }),
    });
  } catch {
    response = null;
  }
  if (!response || !response.ok) {
    // OTP is saved; the user can retry delivery.
    return { success: true, message: 'OTP generated. WhatsApp delivery may be delayed.', phone: cleanedPhone };
  }
  return { success: true, message: 'OTP sent to your WhatsApp successfully.', phone: cleanedPhone };
}

/**
 * Verify an OTP. Returns { success, message, phone }.
 */
export async function verifyOtp({ phone, otp, reason = 'registration' } = {}) {
  if (!phone || !otp) throw new Error('Phone and OTP are required.');
  const cleanedPhone = cleanPhone(phone);

  const { data: record, error: fetchErr } = await supabase
    .from('otp_records')
    .select('*')
    .eq('phone', cleanedPhone)
    .eq('reason', reason)
    .eq('is_verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchErr || !record) {
    throw new Error('No OTP found. Please request a new OTP.');
  }
  if (new Date(record.expires_at) < new Date()) {
    throw new Error('OTP has expired. Please request a new one.');
  }
  if (record.attempts >= record.max_attempts) {
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  await supabase
    .from('otp_records')
    .update({ attempts: record.attempts + 1, updated_at: new Date().toISOString() })
    .eq('id', record.id);

  if (String(record.otp_code) !== String(otp).trim()) {
    throw new Error(remainingAttemptsText(record));
  }

  await supabase
    .from('otp_records')
    .update({ is_verified: true, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', record.id);

  return { success: true, message: 'Phone number verified successfully.', phone: cleanedPhone };
}
