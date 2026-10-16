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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    padding: Spacing.lg,
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
    padding: Spacing.md,
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
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
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
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
});
