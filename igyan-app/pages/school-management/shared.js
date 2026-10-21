/**
 * Shared styles & components for School Management pages
 * Premium dark-theme UI with proper visual hierarchy
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, FlatList, ScrollView, ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ────── Color tokens ────── */
export const C = {
  bg: "#f5f8ff",
  surface: "#ffffff",
  surfaceAlt: "#f0f5ff",
  card: "#ffffff",
  accent: "#4f46e5",
  accentDim: 'rgba(59,130,246,0.12)',
  text: "#12305c",
  textSec: "#12305c",
  muted: "#476b9c",
  dim: "#476b9c",
  border: "#d9e3f3",
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.12)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  purple: '#a855f7',
  purpleDim: 'rgba(168,85,247,0.12)',
  cyan: '#06b6d4',
  cyanDim: 'rgba(6,182,212,0.12)',
};

export const ADMIN_ROLES = ['super_admin', 'co_admin'];

const AVATAR_COLORS = ["#4f46e5", '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#f97316'];
function pickColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ────── Page Header Banner ────── */
export function PageBanner({ icon, title, subtitle, count, accentColor = C.accent }) {
  return (
    <View style={[ms.pageBanner, { borderLeftColor: accentColor }]}>
      <View style={[ms.pageBannerIcon, { backgroundColor: accentColor + '20' }]}>
        <MaterialIcons name={icon} size={22} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ms.pageBannerTitle}>{title}</Text>
        {subtitle ? <Text style={ms.pageBannerSub}>{subtitle}</Text> : null}
      </View>
      {count !== undefined && (
        <View style={[ms.countBadge, { backgroundColor: accentColor + '20' }]}>
          <Text style={[ms.countBadgeText, { color: accentColor }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

/* ────── Session Banner ────── */
export function SessionBanner({ session }) {
  if (!session) return null;
  return (
    <View style={ms.sessionBanner}>
      <MaterialIcons name="calendar-today" size={13} color={C.accent} />
      <Text style={ms.sessionText}>Session: {session.session_name}</Text>
    </View>
  );
}

/* ────── Section Header ────── */
export function SectionHeader({ title, count, onAdd, addLabel = 'Add', addIcon = 'add' }) {
  return (
    <View style={ms.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={ms.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <View style={ms.sectionCount}>
            <Text style={ms.sectionCountText}>{count}</Text>
          </View>
        )}
      </View>
      {onAdd && (
        <TouchableOpacity style={ms.addBtn} onPress={onAdd} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={addLabel} hitSlop={8}>
          <MaterialIcons name={addIcon} size={16} color="#fff" />
          <Text style={ms.addBtnText}>{addLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ────── Empty State ────── */
export function EmptyState({ icon = 'inbox', title = 'Nothing here yet', text, onAction, actionLabel }) {
  return (
    <View style={ms.emptyBox}>
      <View style={ms.emptyIconBox}>
        <MaterialIcons name={icon} size={36} color={C.dim} />
      </View>
      <Text style={ms.emptyTitle}>{title}</Text>
      {text ? <Text style={ms.emptyText}>{text}</Text> : null}
      {onAction && (
        <TouchableOpacity style={ms.emptyAction} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel || 'Add Now'}>
          <MaterialIcons name="add" size={16} color={C.accent} />
          <Text style={ms.emptyActionText}>{actionLabel || 'Add Now'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ────── Class Picker Chips ────── */
export function ClassChips({ classes, selected, onSelect }) {
  return (
    <View style={ms.chipRow}>
      <Text style={ms.chipLabel}>Select class</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {classes.map(cls => {
          const active = selected === cls.id;
          return (
            <TouchableOpacity key={cls.id} style={[ms.chip, active && ms.chipActive]} onPress={() => onSelect(cls.id)} activeOpacity={0.7}>
              <Text style={[ms.chipText, active && ms.chipTextActive]}>{cls.class_name} {cls.section || ''}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ────── User Card (for user lists) ────── */
export function UserCard({ name, email, phone, role, roleBadge, onDelete, onPress }) {
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  const color = pickColor(name);
  return (
    <TouchableOpacity style={ms.userCard} onPress={onPress} activeOpacity={onPress ? 0.65 : 1} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={name ? `User ${name}` : undefined}>
      <View style={[ms.userAvatar, { backgroundColor: color + '25' }]}>
        <Text style={[ms.userAvatarText, { color }]}>{initials}</Text>
      </View>
      <View style={ms.userInfo}>
        <Text style={ms.userName} numberOfLines={1}>{name || 'Unknown'}</Text>
        {email ? <Text style={ms.userEmail} numberOfLines={1}>{email}</Text> : null}
        {phone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <MaterialIcons name="phone" size={10} color={C.dim} />
            <Text style={ms.userPhone}>{phone}</Text>
          </View>
        ) : null}
      </View>
      {roleBadge ? (
        <View style={[ms.roleBadge, { backgroundColor: ROLE_COLORS[role]?.bg || C.accentDim }]}>
          <Text style={[ms.roleBadgeText, { color: ROLE_COLORS[role]?.text || C.accent }]}>{roleBadge}</Text>
        </View>
      ) : null}
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={ms.deleteBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={name ? `Delete user ${name}` : 'Delete user'} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={18} color={C.red} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const ROLE_COLORS = {
  super_admin: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
  co_admin: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  faculty: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
  student: { bg: 'rgba(59,130,246,0.12)', text: "#4f46e5" },
  parent: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  b2c_student: { bg: 'rgba(6,182,212,0.12)', text: '#06b6d4' },
  b2c_mentor: { bg: 'rgba(236,72,153,0.12)', text: '#ec4899' },
};

/* ────── List Card (for subjects, classes, etc.) ────── */
export function ListCard({ icon, iconColor = C.accent, title, subtitle, extra, badge, badgeColor, onDelete }) {
  return (
    <View style={ms.listCard}>
      {icon && (
        <View style={[ms.listIcon, { backgroundColor: (iconColor || C.accent) + '18' }]}>
          <MaterialIcons name={icon} size={18} color={iconColor || C.accent} />
        </View>
      )}
      <View style={ms.listCardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={ms.listCardTitle} numberOfLines={1}>{title}</Text>
          {badge && (
            <View style={[ms.badge, badgeColor && { backgroundColor: badgeColor + '18' }]}>
              <Text style={[ms.badgeText, badgeColor && { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle ? <Text style={ms.listCardSub} numberOfLines={1}>{subtitle}</Text> : null}
        {extra ? <Text style={ms.listCardExtra} numberOfLines={1}>{extra}</Text> : null}
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={ms.deleteBtn} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={title ? `Delete ${title}` : 'Delete item'} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={18} color={C.red} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ────── Labeled Input ────── */
export function Input({ label, placeholder, value, onChangeText, multiline, keyboardType, secureTextEntry, icon, error, accessibilityLabel, editable = true, autoCapitalize, textContentType }) {
  return (
    <View style={ms.inputWrap}>
      {label ? <Text style={ms.inputLabel}>{label}</Text> : null}
      <View style={[ms.inputRow, multiline && { height: 80, alignItems: 'flex-start' }, error && ms.inputInvalid]}>
        {icon && <MaterialIcons name={icon} size={18} color={C.dim} style={{ marginTop: multiline ? 11 : 0 }} />}
        <TextInput
          style={[ms.input, multiline && { height: 70, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          value={value || ''}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          accessibilityLabel={accessibilityLabel || label || placeholder}
        />
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={ms.inputError}>{error}</Text> : null}
    </View>
  );
}

/* ────── Form Modal ────── */
export function FormModal({ visible, title, subtitle, onClose, onSubmit, submitLabel = 'Save', children, busy = false, disableSubmit = false }) {
  const submitDisabled = busy || disableSubmit;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.modalOverlay}>
        <View style={ms.modalBox}>
          <View style={ms.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={ms.modalTitle}>{title}</Text>
              {subtitle ? <Text style={ms.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={ms.modalClose} accessibilityRole="button" accessibilityLabel="Close dialog" hitSlop={8}>
              <MaterialIcons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 4, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <View style={ms.modalFooter}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={ms.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.submitBtn, submitDisabled && ms.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={submitDisabled}
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              accessibilityState={{ disabled: submitDisabled, busy }}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="check" size={18} color="#fff" />
              )}
              <Text style={ms.submitBtnText}>{submitLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ────── Picker Modal ────── */
export function PickerModal({ visible, title, data, renderLabel, renderSub, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = data.filter(item => {
    const txt = `${renderLabel(item)} ${renderSub ? renderSub(item) : ''}`.toLowerCase();
    return txt.includes(search.toLowerCase());
  });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.modalOverlay}>
        <View style={ms.modalBox}>
          <View style={ms.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={ms.modalTitle}>{title}</Text>
              <Text style={ms.modalSubtitle}>Tap to select</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ms.modalClose} accessibilityRole="button" accessibilityLabel="Close dialog" hitSlop={8}>
              <MaterialIcons name="close" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={ms.searchRow}>
              <MaterialIcons name="search" size={18} color={C.dim} />
              <TextInput style={ms.searchInput} placeholder="Search…" placeholderTextColor={C.dim} value={search} onChangeText={setSearch} accessibilityLabel="Search list" />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={C.dim} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const label = renderLabel(item);
              const color = pickColor(label);
              return (
                <TouchableOpacity style={ms.pickerRow} onPress={() => { onSelect(item); setSearch(''); }} activeOpacity={0.6}>
                  <View style={[ms.pickerAvatar, { backgroundColor: color + '20' }]}>
                    <Text style={[ms.pickerAvatarText, { color }]}>{label?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ms.pickerName}>{label}</Text>
                    {renderSub && renderSub(item) ? <Text style={ms.pickerSub}>{renderSub(item)}</Text> : null}
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={C.dim} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <MaterialIcons name="search-off" size={32} color={C.dim} />
                <Text style={[ms.emptyText, { marginTop: 8 }]}>No results found</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ maxHeight: 340 }}
          />
        </View>
      </View>
    </Modal>
  );
}

/* ────── Tab Bar ────── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <View style={ms.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[ms.tab, active === t.key && ms.tabActive]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === t.key }}
          accessibilityLabel={t.label}
        >
          <MaterialIcons name={t.icon} size={16} color={active === t.key ? '#fff' : C.muted} />
          <Text style={[ms.tabText, active === t.key && ms.tabTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ────── Stat Cards Row ────── */
export function StatRow({ stats }) {
  return (
    <View style={ms.statRow}>
      {stats.map((s, i) => (
        <View key={i} style={[ms.statCard, { borderLeftColor: s.color || C.accent }]}>
          <Text style={[ms.statValue, { color: s.color || C.accent }]}>{s.value}</Text>
          <Text style={ms.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ────── Styles ────── */
export const ms = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },

  /* Page banner */
  pageBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderLeftWidth: 3, marginHorizontal: 16, marginTop: 10, borderRadius: 10 },
  pageBannerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pageBannerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  pageBannerSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countBadgeText: { fontSize: 16, fontWeight: '700' },

  /* Session banner */
  sessionBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.accentDim },
  sessionText: { fontSize: 12, fontWeight: '600', color: C.accent },

  /* Section header */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  sectionCount: { backgroundColor: C.surfaceAlt, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sectionCountText: { fontSize: 12, fontWeight: '700', color: C.muted },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  /* Chips */
  chipRow: { marginBottom: 4, gap: 8, marginTop: 8 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: C.dim },
  chip: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 44, justifyContent: 'center', borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 13, fontWeight: '500', color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  /* User card */
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: C.border },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 15, fontWeight: '700' },
  userInfo: { flex: 1, gap: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: C.text },
  userEmail: { fontSize: 12, color: C.muted },
  userPhone: { fontSize: 10, color: C.dim },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  /* List card */
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: C.border },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listCardBody: { flex: 1, gap: 3 },
  listCardTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  listCardSub: { fontSize: 12, color: C.muted },
  listCardExtra: { fontSize: 11, color: C.dim },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.redDim, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: C.amberDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.amber },

  /* Empty state */
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 6 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textSec },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 240 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.accentDim },
  emptyActionText: { fontSize: 13, fontWeight: '600', color: C.accent },

  /* Tabs */
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, minHeight: 44, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '500', color: C.muted },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  /* Stat cards */
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11, color: C.muted },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: C.muted },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: C.accent },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  /* Input */
  inputWrap: { marginBottom: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 6, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  inputInvalid: { borderColor: '#ef4444' },
  inputError: { fontSize: 12, fontWeight: '500', color: '#ef4444', marginTop: 6, marginLeft: 2 },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 12 },

  /* Search */
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },

  /* Picker */
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 15, fontWeight: '700' },
  pickerName: { fontSize: 14, fontWeight: '500', color: C.text },
  pickerSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  /* Muted text */
  mutedText: { fontSize: 13, color: C.muted, textAlign: 'center' },
});
