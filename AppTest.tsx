// App.tsx - Minimum version
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App Loaded!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
});