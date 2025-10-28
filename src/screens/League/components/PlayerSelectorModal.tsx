// src/screens/League/components/PlayerSelectorModal.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Search,
  Check,
  Users,
  Crown,
  Shield,
  ChevronRight,
} from 'lucide-react-native';

// ============================================
// TYPES
// ============================================

interface Player {
  id: string;
  name?: string;
  phoneNumber?: string;
  isPremium?: boolean;
  isDirect?: boolean;
  isAdmin?: boolean;
}

interface PlayerSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selectedPlayerIds: string[]) => void;
  players: Player[];                    // League members
  title?: string;                       // Modal başlığı
  multiSelect?: boolean;                // Çoklu seçim
  excludePlayerIds?: string[];          // Zaten eklenenler
  showBadges?: boolean;                 // Premium/Direct/Admin badges
  emptyMessage?: string;                // Boş mesajı
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayerSelectorModal: React.FC<PlayerSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  players,
  title = 'Oyuncu Seç',
  multiSelect = true,
  excludePlayerIds = [],
  showBadges = true,
  emptyMessage = 'Oyuncu bulunamadı',
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => !excludePlayerIds.includes(player.id));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player => {
        const name = player.name?.toLowerCase() || '';
        const phone = player.phoneNumber?.toLowerCase() || '';
        const id = player.id?.toLowerCase() || '';
        return name.includes(query) || phone.includes(query) || id.includes(query);
      });
    }

    // Sort: Premium -> Direct -> Regular
    return filtered.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      if (a.isDirect && !b.isDirect) return -1;
      if (!a.isDirect && b.isDirect) return 1;
      
      // Alphabetical by name or id
      const aName = a.name || a.id;
      const bName = b.name || b.id;
      return aName.localeCompare(bName);
    });
  }, [players, excludePlayerIds, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleTogglePlayer = (playerId: string) => {
    if (multiSelect) {
      setSelectedPlayerIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
        }
        return newSet;
      });
    } else {
      // Single select - replace selection
      setSelectedPlayerIds(new Set([playerId]));
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.size === filteredPlayers.length) {
      // Deselect all
      setSelectedPlayerIds(new Set());
    } else {
      // Select all
      setSelectedPlayerIds(new Set(filteredPlayers.map(p => p.id)));
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedPlayerIds));
    handleClose();
  };

  const handleClose = () => {
    setSelectedPlayerIds(new Set());
    setSearchQuery('');
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================

  const renderPlayer = (player: Player) => {
    const isSelected = selectedPlayerIds.has(player.id);
    const displayName = player.name || player.phoneNumber || player.id;

    return (
      <TouchableOpacity
        key={player.id}
        style={[styles.playerRow, isSelected && styles.playerRowSelected]}
        onPress={() => handleTogglePlayer(player.id)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="white" strokeWidth={3} />}
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{displayName}</Text>
            
            {/* Badges */}
            {showBadges && (
              <View style={styles.badgesContainer}>
                {player.isAdmin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {player.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color="#8B5CF6" strokeWidth={2} />
                  </View>
                )}
                {player.isDirect && (
                  <View style={styles.directBadge}>
                    <Shield size={12} color="#16a34a" strokeWidth={2} />
                  </View>
                )}
              </View>
            )}
          </View>

          {player.phoneNumber && player.name && (
            <Text style={styles.playerPhone}>{player.phoneNumber}</Text>
          )}
        </View>

        {/* Chevron for single select */}
        {!multiSelect && (
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Users size={24} color="#1F2937" strokeWidth={2} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#1F2937" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Oyuncu ara..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <X size={16} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats & Select All */}
          {multiSelect && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {selectedPlayerIds.size} / {filteredPlayers.length} seçildi
              </Text>
              {filteredPlayers.length > 0 && (
                <TouchableOpacity
                  onPress={handleSelectAll}
                  style={styles.selectAllButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectAllText}>
                    {selectedPlayerIds.size === filteredPlayers.length
                      ? 'Tümünü Kaldır'
                      : 'Tümünü Seç'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Player List */}
          <ScrollView
            style={styles.playerList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playerListContent}
          >
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(renderPlayer)
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" strokeWidth={2} />
                <Text style={styles.emptyStateText}>{emptyMessage}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedPlayerIds.size === 0 && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedPlayerIds.size === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>
                {multiSelect
                  ? `Seç (${selectedPlayerIds.size})`
                  : 'Seç'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '85%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  selectAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  selectAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '700',
  },

  // Player List
  playerList: {
    flex: 1,
  },
  playerListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerRowSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },

  // Player Info
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  playerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Badges
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  premiumBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 16,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});