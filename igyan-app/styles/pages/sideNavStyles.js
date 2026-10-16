/**
 * iGyan App - Side Navigation Styles
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(280, SCREEN_WIDTH * 0.78);

export const sideNavStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: "#f5f8ff",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomRightRadius: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: "#d9e3f3",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: "#12305c",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ffffff",
    marginHorizontal: 14,
    marginVertical: 6,
  },
  navSection: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 1,
  },
  navIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 171, 244, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: "#12305c",
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  logoutItem: {
    marginTop: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutLabel: {
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: "#d9e3f3",
    marginHorizontal: 14,
  },
  footerText: {
    fontSize: 11,
    color: '#7a8b9c',
  },
});

export const DRAWER_WIDTH_EXPORT = DRAWER_WIDTH;
