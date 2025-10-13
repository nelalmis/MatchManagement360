// src/components/CopyableText.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  ToastAndroid,
  Platform,
  Vibration,
} from 'react-native';
import { Copy, Check } from 'lucide-react-native';

interface CopyableTextProps {
  label: string;
  value: string;
  format?: (value: string) => string;
  successMessage?: string;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  label,
  value,
  format,
  successMessage = 'Kopyalandı',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(50);
      }

      const cleanValue = value.replace(/\s/g, '');
      await Clipboard.setString(cleanValue);
      setCopied(true);

      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      }

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const displayValue = format ? format(value) : value;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value} selectable>
          {displayValue}
        </Text>
        <TouchableOpacity
          style={[styles.button, copied && styles.buttonSuccess]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          {copied ? (
            <Check size={16} color="white" strokeWidth={2.5} />
          ) : (
            <Copy size={16} color="#6B7280" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#16a34a',
  },
});