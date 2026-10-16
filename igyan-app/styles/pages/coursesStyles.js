/**
 * iGyan App - Courses Page Styles
 */

import { StyleSheet } from 'react-native';
import { Spacing, FontSizes } from '../../constants/theme';

export const coursesStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.md,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: "#4f46e5",
  },
  categoryChipInactive: {
    backgroundColor: '#E0E0E0',
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryTextInactive: {
    color: '#333333',
  },
  coursesList: {
    padding: Spacing.md,
  },
  courseCard: {
    borderRadius: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E0E0',
  },
  courseContent: {
    padding: Spacing.md,
  },
  courseTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  courseDescription: {
    fontSize: FontSizes.sm,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  courseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDuration: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
  },
  coursePrice: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: "#4f46e5",
  },
  courseFree: {
    color: '#43A047',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: "#4f46e5",
    borderRadius: 2,
  },
});
