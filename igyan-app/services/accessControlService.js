/**
 * iGyan App - Access control service (ported from igyan-mvp
 * access_control.js and access-control.js on table `user_access`)
 *
 * Async functions query Supabase; the sync helpers evaluate an already
 * loaded access map (see getUserAccess) without a network round trip.
 */
import { supabase } from '../utils/supabase';
import { DEFAULT_ROLE_ACCESS, hasRequiredAccess, canPerformAction, getAccessLevelPure } from './apiUtils';

export { hasRequiredAccess, canPerformAction, getAccessLevelPure };

async function getUserRole(userId) {
  const res = await supabase.from('users').select('role').eq('id', userId).single();
  if (res.error) throw new Error(`getUserRole: ${res.error.message}`);
  return res.data.role;
}

/** Async: does the user have at least `requiredAccess` on `moduleName`? */
export async function checkUserAccess(userId, moduleName, requiredAccess = 'view') {
  try {
    if ((await getUserRole(userId)) === 'super_admin') return true;
    const res = await supabase
      .from('user_access')
      .select('access_type')
      .eq('user_id', userId)
      .eq('module_name', moduleName)
      .single();
    if (res.error) return false;
    return hasRequiredAccess(res.data.access_type, requiredAccess);
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/** Async: all accessible modules for a user. */
export async function getUserAccessibleModules(userId) {
  try {
    if ((await getUserRole(userId)) === 'super_admin') {
      return { isSuperAdmin: true, modules: [] };
    }
    const res = await supabase.from('user_access').select('*').eq('user_id', userId).neq('access_type', 'none');
    if (res.error) throw res.error;
    return { isSuperAdmin: false, modules: res.data || [] };
  } catch (error) {
    console.error('Error getting user accessible modules:', error);
    return { isSuperAdmin: false, modules: [] };
  }
}

/** Async: can the user perform `action` (view/edit/delete) on `moduleName`? */
export async function canUserPerformAction(userId, moduleName, action) {
  try {
    if ((await getUserRole(userId)) === 'super_admin') return true;
    const res = await supabase
      .from('user_access')
      .select('access_type')
      .eq('user_id', userId)
      .eq('module_name', moduleName)
      .single();
    if (res.error) return false;
    return canPerformAction(res.data.access_type, action);
  } catch (error) {
    console.error('Error checking user action:', error);
    return false;
  }
}

/** Async: insert default module grants for a role. */
export async function grantDefaultAccess(userId, role) {
  const accessList = DEFAULT_ROLE_ACCESS[role] || [];
  if (accessList.length === 0) return;
  try {
    const { error } = await supabase.from('user_access').insert(
      accessList.map((item) => ({ user_id: userId, module_name: item.module, access_type: item.access })),
    );
    if (error) throw error;
  } catch (error) {
    console.error('Error granting default access:', error);
  }
}

/** Async: full access map { moduleName: accessType } for a user. */
export async function getUserAccess(userId) {
  try {
    const res = await supabase.from('user_access').select('*').eq('user_id', userId);
    if (res.error) throw res.error;
    const accessMap = {};
    (res.data || []).forEach((access) => {
      accessMap[access.module_name] = access.access_type;
    });
    return accessMap;
  } catch (error) {
    console.error('Error fetching user access:', error);
    return {};
  }
}

/** Sync: any access (not 'none') on a module. Super admins pass everything. */
export function hasModuleAccess(user, moduleName, userAccess = {}) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const accessType = userAccess[moduleName];
  return Boolean(accessType && accessType !== 'none');
}

/** Sync: edit access on a module. */
export function canEdit(user, moduleName, userAccess = {}) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const accessType = userAccess[moduleName];
  return accessType === 'edit' || accessType === 'all';
}

/** Sync: delete access on a module. */
export function canDelete(user, moduleName, userAccess = {}) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const accessType = userAccess[moduleName];
  return accessType === 'delete' || accessType === 'all';
}

/** Sync: full ('all') access on a module. */
export function hasFullAccess(user, moduleName, userAccess = {}) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return userAccess[moduleName] === 'all';
}

/** Async: upsert a user's access for a module. */
export async function updateUserAccess(userId, moduleName, accessType, subDomain = null) {
  try {
    const existing = await supabase
      .from('user_access')
      .select('id')
      .eq('user_id', userId)
      .eq('module_name', moduleName)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const { error } = await supabase
        .from('user_access')
        .update({ access_type: accessType, sub_domain: subDomain })
        .eq('id', existing.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_access')
        .insert([{ user_id: userId, module_name: moduleName, access_type: accessType, sub_domain: subDomain }]);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating user access:', error);
    return { success: false, error: error.message };
  }
}

/** Async: remove a user's access for a module. */
export async function removeUserAccess(userId, moduleName) {
  try {
    const { error } = await supabase
      .from('user_access')
      .delete()
      .eq('user_id', userId)
      .eq('module_name', moduleName);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing user access:', error);
    return { success: false, error: error.message };
  }
}

/** Async: replace all of a user's grants with 'all' on the given modules. */
export async function grantFullAccess(userId, moduleNames) {
  try {
    const { error: deleteError } = await supabase.from('user_access').delete().eq('user_id', userId);
    if (deleteError) throw deleteError;
    const { error: insertError } = await supabase
      .from('user_access')
      .insert((moduleNames || []).map((moduleName) => ({ user_id: userId, module_name: moduleName, access_type: 'all' })));
    if (insertError) throw insertError;
    return { success: true };
  } catch (error) {
    console.error('Error granting full access:', error);
    return { success: false, error: error.message };
  }
}

/** Async: revoke every grant for a user. */
export async function revokeAllAccess(userId) {
  try {
    const { error } = await supabase.from('user_access').delete().eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error revoking all access:', error);
    return { success: false, error: error.message };
  }
}
