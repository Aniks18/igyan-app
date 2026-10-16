/**
 * iGyan App - Home Page Styles
 */

import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  titleText: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  brandText: {
    color: "#4f46e5",
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  featuredCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: "#4f46e5",
  },
  featuredTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: "#12305c",
    marginBottom: Spacing.sm,
  },
  featuredDescription: {
    fontSize: FontSizes.md,
    color: "#12305c",
    opacity: 0.9,
    marginBottom: Spacing.md,
  },
  featuredButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: "#4f46e5",
    fontWeight: 'bold',
  },
  courseCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginRight: Spacing.md,
    width: 200,
  },
  courseImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: Spacing.sm,
  },
  courseTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  courseInstructor: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    minWidth: 100,
  },
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
});
