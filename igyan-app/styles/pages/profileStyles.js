/**
 * iGyan App - Profile Page Styles
 */

import { StyleSheet } from 'react-native';
import { Spacing, FontSizes } from '../../constants/theme';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  avatarContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSizes.md,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  menuSection: {
    paddingHorizontal: 24,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    marginBottom: 12,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: FontSizes.md,
  },
  menuArrow: {
    opacity: 0.5,
  },
  logoutButton: {
    marginHorizontal: 24,
    marginVertical: Spacing.md,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#FF5252',
  },
  logoutText: {
    color: "#12305c",
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  achievementBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
});
