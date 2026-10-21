/**
 * iGyan App - Authentication Context
 * Manages user authentication, sessions, and role-based access control
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSessionToken, setSessionToken, removeSessionToken } from './secureSession';
import { supabase } from './supabase';
import { hashPassword, generateToken, getDeviceInfo, getUserIP } from './crypto';

const AuthContext = createContext();

// Role definitions
const INSTITUTIONAL_ROLES = ['super_admin', 'co_admin', 'student', 'faculty', 'parent'];
const PROFESSIONAL_ROLES = ['b2c_student', 'b2c_mentor'];

// Roles a user may self-select at signup. Elevated roles (admins, faculty,
// mentors) must be assigned by an existing privileged user, never by the
// registrant. This is defense-in-depth alongside server-side checks.
const SELF_SIGNUP_ROLES = ['student', 'b2c_student'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Check if user has valid session
   */
  const checkSession = async () => {
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      // Verify session in database
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*, users(*)')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !sessionData) {
        await removeSessionToken();
        setLoading(false);
        return;
      }

      // Check if session expired
      if (new Date(sessionData.expires_at) < new Date()) {
        await logout();
        return;
      }

      // Update last activity. Best-effort only: an offline or failed
      // heartbeat must not invalidate an otherwise valid session.
      try {
        await supabase
          .from('sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', sessionData.id);
      } catch (heartbeatError) {
        console.warn('Session heartbeat failed:', heartbeatError);
      }

      setUser(sessionData.users);
      setSession(sessionData);
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login function with role-based access control
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} loginVariant - "institutionalSuite" | "professionalSuite"
   */
  const login = async (email, password, loginVariant = null) => {
    try {
      // 1. Hash the password
      const passwordHash = await hashPassword(password);

      // 2. Query user from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid email or password');
      }

      // 3. ROLE-BASED ACCESS CONTROL
      if (loginVariant === "institutionalSuite") {
        if (!INSTITUTIONAL_ROLES.includes(userData.role)) {
          throw new Error(
            'Access denied. This portal is for institutional users (super_admin, co_admin, student, faculty) only. Please use the Professional Suite portal for B2C access.'
          );
        }
      } else if (loginVariant === "professionalSuite") {
        if (!PROFESSIONAL_ROLES.includes(userData.role)) {
          throw new Error(
            'Access denied. This portal is for B2C users (b2c_student, b2c_mentor) only. Please use the Institutional Suite portal.'
          );
        }
      }

      // 4. Collect device information
      const deviceInfo = getDeviceInfo();
      const ipAddress = await getUserIP();

      // 5. Generate session tokens
      const sessionToken = generateToken();
      const refreshToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // 6. Create session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: userData.id,
            session_token: sessionToken,
            refresh_token: refreshToken,
            device_type: deviceInfo.deviceType,
            os_name: deviceInfo.osName,
            browser_name: deviceInfo.browserName,
            user_agent: deviceInfo.userAgent,
            ip_address: ipAddress,
            expires_at: expiresAt.toISOString(),
            is_active: true
          }
        ])
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // 7. Store session token locally (encrypted store)
      await setSessionToken(sessionToken);

      // 8. Update state
      setUser(userData);
      setSession(sessionData);

      return { success: true, data: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      const sessionToken = await getSessionToken();
      if (sessionToken) {
        // Mark session as inactive. A network failure here must not trap
        // the user in a stale-token loop, so the local token is always
        // cleared in the finally block below.
        try {
          await supabase
            .from('sessions')
            .update({
              is_active: false,
              logout_at: new Date().toISOString()
            })
            .eq('session_token', sessionToken);
        } catch (serverError) {
          console.warn('Server session deactivation failed:', serverError);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await removeSessionToken();
      setUser(null);
      setSession(null);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      const passwordHash = await hashPassword(userData.password);

      // Never trust a client-supplied role: coerce anything outside the
      // self-signup allowlist down to the least-privilege default.
      const requestedRole = userData.role;
      const safeRole = SELF_SIGNUP_ROLES.includes(requestedRole)
        ? requestedRole
        : 'student';

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            password_hash: passwordHash,
            full_name: userData.fullName,
            phone: userData.phone,
            role: safeRole,
            school_id: userData.schoolId || null
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    register,
    checkSession,
    isAuthenticated: !!user,
    isInstitutional: user && INSTITUTIONAL_ROLES.includes(user.role),
    isProfessional: user && PROFESSIONAL_ROLES.includes(user.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
