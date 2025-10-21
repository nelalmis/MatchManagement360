// src/components/layout/Screen.tsx
import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../config/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  safeArea?: boolean;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export default function Screen({
  children,
  scroll = false,
  safeArea = true,
  keyboardAvoiding = true,
  style,
  contentContainerStyle,
  backgroundColor = colors.background.default,
  statusBarStyle = 'dark-content',
}: ScreenProps) {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    style,
  ];

  // Status bar
  const statusBar = (
    <StatusBar
      barStyle={statusBarStyle}
      backgroundColor={backgroundColor}
    />
  );

  // Base content
  const content = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>
      {children}
    </View>
  );

  // Keyboard avoiding wrapper
  const keyboardAvoidingContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  // Safe area wrapper
  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
        {statusBar}
        {keyboardAvoidingContent}
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {statusBar}
      {keyboardAvoidingContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});


/*
import { Screen, Header, Container } from '../components';

export default function ExampleScreen() {
  return (
    <Screen scroll>
      <Header title="Example" showBackButton />
      <Container padding="large">
        <Text>Content here</Text>
      </Container>
    </Screen>
  );
}

*/