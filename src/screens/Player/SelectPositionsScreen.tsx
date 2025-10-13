import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import {
  X,
  Check,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import {
  SportType,
  SPORT_CONFIGS,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { NavigationService } from '../../navigation/NavigationService';

interface RouteParams {
  sport: SportType;
  selectedPositions: string[];
  onSave: (positions: string[]) => void;
}

export const SelectPositionsScreen: React.FC = () => {
  const route: any = useRoute();
  const { sport, selectedPositions, onSave } = route.params as RouteParams;

  const [positions, setPositions] = useState<string[]>(selectedPositions || []);
  const [slideAnim] = useState(new Animated.Value(0));

  const config = SPORT_CONFIGS[sport];
  const sportColor = getSportColor(sport);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const handleTogglePosition = useCallback((position: string) => {
    setPositions((prev) => {
      if (prev.includes(position)) {
        return prev.filter((p) => p !== position);
      } else {
        return [...prev, position];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (positions.length === config.positions.length) {
      setPositions([]);
    } else {
      setPositions([...config.positions]);
    }
  }, [positions, config.positions]);

  const handleSave = useCallback(() => {
    onSave(positions);
    handleClose();
  }, [positions, onSave]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      NavigationService.goBack();
    });
  }, [slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const allSelected = positions.length === config.positions.length;
  const someSelected = positions.length > 0 && positions.length < config.positions.length;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View style={{ opacity }} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.sportEmoji}>{getSportIcon(sport)}</Text>
              <View>
                <Text style={styles.headerTitle}>{config.name}</Text>
                <Text style={styles.headerSubtitle}>Pozisyon Seçimi</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Selected Count */}
          <View style={[styles.countBadge, { backgroundColor: sportColor + '20' }]}>
            <Text style={[styles.countText, { color: sportColor }]}>
              {positions.length} / {config.positions.length} pozisyon seçildi
            </Text>
          </View>

          {/* Select All Button */}
          <TouchableOpacity
            style={[
              styles.selectAllButton,
              allSelected && { borderColor: sportColor, backgroundColor: sportColor + '10' },
            ]}
            onPress={handleSelectAll}
            activeOpacity={0.7}
          >
            <View style={styles.selectAllLeft}>
              {allSelected ? (
                <CheckCircle2 size={20} color={sportColor} strokeWidth={2.5} />
              ) : someSelected ? (
                <View style={[styles.partialCheck, { backgroundColor: sportColor }]}>
                  <View style={styles.partialCheckInner} />
                </View>
              ) : (
                <Circle size={20} color="#D1D5DB" strokeWidth={2} />
              )}
              <Text
                style={[
                  styles.selectAllText,
                  (allSelected || someSelected) && { color: sportColor, fontWeight: '700' },
                ]}
              >
                Tümünü Seç
              </Text>
            </View>
            {(allSelected || someSelected) && (
              <Text style={[styles.selectAllBadge, { color: sportColor }]}>
                {positions.length}
              </Text>
            )}
          </TouchableOpacity>

          {/* Positions List */}
          <ScrollView
            style={styles.positionsList}
            showsVerticalScrollIndicator={false}
          >
            {config.positions.map((position, index) => {
              const isSelected = positions.includes(position);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.positionItem,
                    isSelected && {
                      borderColor: sportColor,
                      backgroundColor: sportColor + '10',
                    },
                  ]}
                  onPress={() => handleTogglePosition(position)}
                  activeOpacity={0.7}
                >
                  <View style={styles.positionLeft}>
                    {isSelected ? (
                      <CheckCircle2 size={22} color={sportColor} strokeWidth={2.5} />
                    ) : (
                      <Circle size={22} color="#D1D5DB" strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.positionText,
                        isSelected && {
                          color: sportColor,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {position}
                    </Text>
                  </View>
                  {isSelected && (
                    <Animated.View
                      style={[
                        styles.checkMark,
                        { backgroundColor: sportColor },
                      ]}
                    >
                      <Check size={14} color="white" strokeWidth={3} />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              );
            })}

            {config.positions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Bu spor için pozisyon tanımlanmamış
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: sportColor },
                positions.length === 0 && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={positions.length === 0}
              activeOpacity={0.7}
            >
              <Check size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>
                Kaydet ({positions.length})
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sportEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  countBadge: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectAllButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectAllBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  partialCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partialCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  positionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  positionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});