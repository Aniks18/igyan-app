import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { githubUI as c } from '../constants/githubUI';

// Same asset and size variants as the web repository's components/logo.js.
const sizes = { hero: 200, header: 48, sidebar: 44, card: 64, compact: 40 };

export default function BrandLogo({ variant = 'header', size, showName = false, style }) {
  const dimension = size ?? sizes[variant] ?? sizes.header;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="IGYAN AI logo" style={[styles.brand, style]}>
      <Image accessible={false} source={require('../assets/brand/igyan-ai-mark.png')}
        style={{ width: dimension, height: dimension }} resizeMode="contain" />
      {showName && <Text style={styles.name}>IGYAN AI</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: c.heading, fontSize: 24, fontWeight: '800', flexShrink: 1 },
});
