/**
 * iGyan App Theme - Educational Company
 * Colors and styling constants for the app
 */

import { Platform } from 'react-native';

// iGyan Brand Colors
const darkNavy = '#0f172a';      // Dark navy - primary background
const tealBlue = '#1e293b';      // Teal blue - secondary elements
const brightCyan = '#4f46e5';    // Bright cyan - accents and CTAs
const lightGray = '#f8fafc';     // Light gray - text on dark

const tintColorLight = '#4f46e5';
const tintColorDark = brightCyan;

export const Colors = {
  light: {
    text: '#12305c',
    background: '#f5f8ff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#4f46e5',
    secondary: tealBlue,
    accent: '#4f46e5',
    darkBg: darkNavy,
    lightText: lightGray,
    card: '#ffffff',
    border: '#d9e3f3',
  },
  dark: {
    text: '#ECEDEE',
    background: darkNavy,
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#4f46e5',
    secondary: tealBlue,
    accent: '#4f46e5',
    darkBg: darkNavy,
    lightText: lightGray,
    card: tealBlue,
    border: '#333333',
  },
};

export const Fonts = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    rounded: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto',
    bold: 'Roboto',
    rounded: 'Roboto',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    rounded: 'System',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  title: 28,
};
