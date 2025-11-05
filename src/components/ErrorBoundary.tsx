// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.log('🔴 Error caught:', error);
  console.log('🔴 Error message:', error.message);
  console.log('🔴 Error stack:', error.stack);
  console.log('🔴 Component stack:', errorInfo.componentStack);
  
  // Hangi component'te hata var bul
  const componentStack = errorInfo.componentStack;
  console.log('🔴 Component stack lines:', componentStack?.split('\n'));
}
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Bir hata oluştu</Text>
          <Text style={styles.error}>{this.state.error?.toString()}</Text>
          <Text style={styles.stack}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
  error: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  stack: {
    fontSize: 12,
    color: '#666',
  },
});