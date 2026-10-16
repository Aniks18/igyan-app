/**
 * iGyan App - Global/Common Styles
 */

import { StyleSheet } from 'react-native';
import { Spacing, FontSizes } from '../constants/theme';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Padding & Margin helpers
  padding: {
    padding: Spacing.md,
  },
  paddingHorizontal: {
    paddingHorizontal: Spacing.md,
  },
  paddingVertical: {
    paddingVertical: Spacing.md,
  },
  marginBottom: {
    marginBottom: Spacing.md,
  },
  marginTop: {
    marginTop: Spacing.md,
  },

  // Typography
  title: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  smallText: {
    fontSize: FontSizes.sm,
  },
  link: {
    color: "#4f46e5",
    fontSize: FontSizes.md,
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: "#4f46e5",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: "#4f46e5",
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },

  // Cards
  card: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.md,
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: Spacing.md,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
