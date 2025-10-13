import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Contacts from 'react-native-contacts';

// 🔹 Tip Tanımlamaları
interface Contact {
  recordID: string;
  displayName: string;
  phoneNumbers: Array<{ number: string; label?: string }>;
  emailAddresses?: Array<{ email: string }>;
}

interface ContactSelectorProps {
  visible: boolean; // 🔹 Modal görünürlüğü
  selectedPlayerIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onManualAdd?: (phone: string) => void;
  onClose: () => void; // 🔹 Artık zorunlu
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  visible,
  selectedPlayerIds,
  onSelectionChange,
  onManualAdd,
  onClose,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPlayerIds);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [manualPhone, setManualPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 🔹 İzin İsteme Fonksiyonu
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Rehber Erişimi',
            message: 'Oyuncu eklemek için rehber erişimine ihtiyacımız var.',
            buttonPositive: 'İzin Ver',
            buttonNegative: 'İptal',
          }
        );
        return permission === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === 'ios') {
        const permission = await Contacts.checkPermission();

        if (permission === 'undefined' || permission === 'denied') {
          const result = await Contacts.requestPermission();
          return result === 'authorized';
        }

        return permission === 'authorized';
      }
      return true;
    } catch (err) {
      console.error('İzin hatası:', err);
      return false;
    }
  };

  // 🔹 Kişileri Yükleme
  useEffect(() => {
    if (!visible) return;

    const loadContacts = async () => {
      try {
        setLoading(true);
        setError(null);

        const hasPermission = await requestPermission();

        if (!hasPermission) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        const data = await Contacts.getAll();

        // Sadece telefon numarası olanları filtrele ve sırala
        const validContacts = data
          .filter((contact: any) =>
            contact.phoneNumbers && contact.phoneNumbers.length > 0
          )
          .sort((a: any, b: any) =>
            (a.displayName || '').localeCompare(b.displayName || '')
          );

        setContacts(validContacts as Contact[]);
        setHasPermission(true);
      } catch (err) {
        console.error('Rehber yükleme hatası:', err);
        setError('Rehber yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [visible]);

  // 🔹 selectedPlayerIds değiştiğinde güncelle
  useEffect(() => {
    setSelectedIds(selectedPlayerIds);
  }, [selectedPlayerIds]);

  // 🔹 Telefon Numarası Validasyonu
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
    return phoneRegex.test(phone);
  };

  // 🔹 Kişi Seçme/Kaldırma
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      onSelectionChange(updated);
      return updated;
    });
  }, [onSelectionChange]);

  // 🔹 Tümünü Seç
  const selectAll = useCallback(() => {
    const allIds = contacts.map((c) => c.recordID);
    setSelectedIds(allIds);
    onSelectionChange(allIds);
  }, [contacts, onSelectionChange]);

  // 🔹 Tümünü Kaldır
  const clearAll = useCallback(() => {
    setSelectedIds([]);
    onSelectionChange([]);
  }, [onSelectionChange]);

  // 🔹 Manuel Numara Ekleme
  const handleManualAdd = () => {
    const trimmed = manualPhone.trim();

    if (!trimmed) {
      Alert.alert('Uyarı', 'Lütfen bir telefon numarası girin.');
      return;
    }

    if (!validatePhoneNumber(trimmed)) {
      Alert.alert('Hata', 'Geçersiz telefon numarası formatı.');
      return;
    }

    if (onManualAdd) {
      onManualAdd(trimmed);
      setManualPhone('');
      Keyboard.dismiss();
      //Alert.alert('Başarılı', 'Oyuncu eklendi!');
    }
  };

  // 🔹 Filtrelenmiş Kişiler (Arama)
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter((contact) => {
      const nameMatch = contact.displayName.toLowerCase().includes(query);
      const phoneMatch = contact.phoneNumbers.some((p) =>
        p.number.includes(query)
      );
      return nameMatch || phoneMatch;
    });
  }, [contacts, searchQuery]);

  // 🔹 Modal İçeriği
  const renderContent = () => {
    // Yükleniyor Durumu
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="white" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rehber</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Rehber yükleniyor...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Hata Durumu
    if (error) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="white" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rehber</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                setError(null);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // İzin Yok - Manuel Ekleme Ekranı
    if (!hasPermission) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="white" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Manuel Oyuncu Ekle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                contentContainerStyle={styles.permissionScrollContainer}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionText}>
                    📵 Rehber erişim izni verilmedi.{'\n'}
                    Oyuncuyu manuel olarak ekleyebilirsin.
                  </Text>

                  <View style={styles.manualInputContainer}>
                    <TextInput
                      style={styles.manualInput}
                      placeholder="Telefon numarası gir (örn: +90 555 123 4567)"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={manualPhone}
                      onChangeText={setManualPhone}
                      returnKeyType="done"
                      onSubmitEditing={handleManualAdd}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleManualAdd}
                    style={styles.addButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>➕ Ekle</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>veya</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    onPress={async () => {
                      Keyboard.dismiss();
                      const granted = await requestPermission();
                      if (granted) {
                        setHasPermission(true);
                        setLoading(true);
                      }
                    }}
                    style={styles.requestPermissionButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.requestPermissionText}>
                      🔓 Rehber İzni Ver
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    // Ana Ekran
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rehberden Seç</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Arama Çubuğu */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Kişi ara..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Seçim Butonları */}
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
            <Text style={styles.selectAllText}>✅ Tümünü Seç</Text>
          </TouchableOpacity>

          <Text style={styles.selectedCount}>
            {selectedIds.length} / {contacts.length}
          </Text>

          <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
            <Text style={styles.clearAllText}>❌ Temizle</Text>
          </TouchableOpacity>
        </View>

        {/* Kişi Listesi */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.recordID}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.recordID);
            const phone = item.phoneNumbers[0]?.number || '';

            return (
              <TouchableOpacity
                onPress={() => toggleSelect(item.recordID)}
                style={[
                  styles.contactItem,
                  isSelected && styles.contactItemSelected,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {item.displayName}
                  </Text>
                  {phone ? (
                    <Text style={styles.contactPhone}>{phone}</Text>
                  ) : null}
                </View>
                <Text style={styles.checkmark}>
                  {isSelected ? '✅' : '⬜'}
                </Text>
              </TouchableOpacity>
            );
          }}
          getItemLayout={(data, index) => ({
            length: 70,
            offset: 70 * index,
            index,
          })}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? '🔍 Kişi bulunamadı' : '📱 Rehberiniz boş'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {renderContent()}
    </Modal>
  );
};

// 🎨 Stiller
const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: 'white',
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '400',
    lineHeight: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  permissionScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  permissionContent: {
    width: '100%',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#333',
    lineHeight: 24,
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  manualInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  requestPermissionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  requestPermissionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 15,
  },
  clearAllText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  contactItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: 'white',
  },
  contactItemSelected: {
    backgroundColor: '#dcfce7',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});