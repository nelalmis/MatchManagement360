// src/components/DateTimePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, X } from 'lucide-react-native';

interface DateTimePickerProps {
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  mode,
  onChange,
  label,
  placeholder,
  minimumDate,
  maximumDate,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>(
    mode === 'datetime' ? 'date' : mode
  );

  const formatDate = (date: Date): string => {
    if (!date) return placeholder || 'Tarih Seç';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (mode === 'date') {
      return `${day}.${month}.${year}`;
    } else if (mode === 'time') {
      return `${hours}:${minutes}`;
    } else {
      return `${day}.${month}.${year} - ${hours}:${minutes}`;
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
  if (Platform.OS === 'android') {
    setShowPicker(false);
    
    if (event.type === 'set') {
      // selectedDate boş gelirse timestamp'ten al
      const finalDate = selectedDate?.getTime() ? new Date(selectedDate.getTime()) : (event.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : null);
      
      if (finalDate) {
        if (mode === 'datetime' && currentMode === 'date') {
          setTempDate(finalDate);
          setCurrentMode('time');
          setShowPicker(true);
        } else {
          onChange(finalDate);
          setCurrentMode('date');
        }
      }
    } else {
      setCurrentMode('date');
    }
  } else {
    // iOS için
    const finalDate = selectedDate?.getTime() ? new Date(selectedDate.getTime()) : (event.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : null);
    if (finalDate) {
      setTempDate(finalDate);
    }
  }
};

  const handleIOSConfirm = () => {
    if (mode === 'datetime' && currentMode === 'date') {
      setCurrentMode('time');
    } else {
      onChange(tempDate);
      setShowPicker(false);
      setCurrentMode('date');
    }
  };

  const handleIOSCancel = () => {
    setShowPicker(false);
    setTempDate(value);
    setCurrentMode('date');
  };

  const renderIOSPicker = () => (
    <Modal
      visible={showPicker}
      transparent
      animationType="slide"
      onRequestClose={handleIOSCancel}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleIOSCancel} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleIOSCancel} style={styles.modalButton}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {currentMode === 'date' ? 'Tarih Seç' : 'Saat Seç'}
            </Text>
            <Pressable onPress={handleIOSConfirm} style={styles.modalButton}>
              <Text style={styles.confirmText}>
                {mode === 'datetime' && currentMode === 'date' ? 'İleri' : 'Tamam'}
              </Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={tempDate}
            mode={currentMode}
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            locale="tr-TR"
            textColor="#000"
          />
        </View>
      </View>
    </Modal>
  );

  const renderAndroidPicker = () => {
    if (!showPicker) return null;

    return (
      <DateTimePicker
        value={tempDate}
        mode={currentMode}
        display="default"
        onChange={handleChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        is24Hour={true}
        locale="tr-TR"
      />
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable
        style={[styles.inputContainer, disabled && styles.disabled]}
        onPress={() => {
          if (!disabled) {
            setTempDate(value);
            setShowPicker(true);
          }
        }}
        disabled={disabled}
      >
        <View style={styles.inputContent}>
          {mode === 'time' ? (
            <Clock size={20} color="#666" />
          ) : (
            <Calendar size={20} color="#666" />
          )}
          <Text style={[styles.inputText, !value && styles.placeholder]}>
            {formatDate(value)}
          </Text>
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? renderIOSPicker() : renderAndroidPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: '#f8f8f8',
    opacity: 0.6,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 15,
    color: '#1a1a1a',
    marginLeft: 12,
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },

  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelText: {
    fontSize: 17,
    color: '#666',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});