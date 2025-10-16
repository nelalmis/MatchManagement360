// screens/Match/FriendlyMatchTemplatesScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Share2,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Zap,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import {
  IFriendlyMatchConfig,
  IMatch,
  getSportIcon,
  getSportColor,
  SportType,
  SPORT_CONFIGS,
} from '../../types/types';
import { friendlyMatchConfigService } from '../../services/friendlyMatchConfigService';

interface TemplateWithStats {
  template: NonNullable<IFriendlyMatchConfig['templates']>[number]
  usageCount: number;
  lastUsed?: string;
}

export const FriendlyMatchTemplatesScreen: React.FC = () => {
  const { user } = useAppContext();

  const [config, setConfig] = useState<IFriendlyMatchConfig | null>(null);
  const [templates, setTemplates] = useState<TemplateWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = eventManager.on(Events.TEMPLATE_UPDATED, loadData);
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      // Get or create config
      const configData = await friendlyMatchConfigService.getOrCreateConfig(user.id);
      setConfig(configData);

      // Get template usage stats (you'd need to track this in matches)
      const templatesWithStats: TemplateWithStats[] = (configData.templates || []).map(template => ({
        template,
        usageCount: 0, // TODO: Calculate from matches that used this template
        lastUsed: undefined, // TODO: Get last usage date
      }));

      setTemplates(templatesWithStats);

    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Hata', 'Şablonlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateTemplate = () => {
    NavigationService.navigateToCreateFriendlyMatchTemplate();
  };

  const handleEditTemplate = (templateId: string) => {
    NavigationService.navigateToEditFriendlyMatchTemplate(templateId);
  };

  const handleDuplicateTemplate = async (template: NonNullable<IFriendlyMatchConfig['templates']>[number]) => {
    try {
      const newTemplateId = await friendlyMatchConfigService.duplicateTemplate(
        user!.id!,
        template.id
      );

      Alert.alert('Başarılı', 'Şablon kopyalandı');
      await loadData();
      eventManager.emit(Events.TEMPLATE_UPDATED);

    } catch (error: any) {
      console.error('Error duplicating template:', error);
      Alert.alert('Hata', error.message || 'Şablon kopyalanırken bir hata oluştu');
    }
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    Alert.alert(
      'Şablonu Sil',
      `"${templateName}" şablonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendlyMatchConfigService.deleteTemplate(user!.id!, templateId);
              Alert.alert('Başarılı', 'Şablon silindi');
              await loadData();
              eventManager.emit(Events.TEMPLATE_UPDATED);
            } catch (error: any) {
              console.error('Error deleting template:', error);
              Alert.alert('Hata', error.message || 'Şablon silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleShareTemplate = async (template: NonNullable<IFriendlyMatchConfig['templates']>[number]) => {
    try {
      const message = `📋 Dostluk Maçı Şablonu: ${template.name}\n\n` +
        `📍 Saha: ${template.settings.location || 'Belirtilmemiş'}\n` +
        `👥 Oyuncu: ${template.settings.staffPlayerCount || 10} + ${template.settings.reservePlayerCount || 2} yedek\n` +
        `💰 Ücret: ${template.settings.pricePerPlayer || 0} TL\n` +
        `⏱ Süre: ${template.settings.matchTotalTimeInMinute || 60} dakika`;

      await Share.share({
        message,
        title: template.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleQuickCreate = (template: NonNullable<IFriendlyMatchConfig['templates']>[number]) => {
    NavigationService.navigateToCreateFriendlyMatch(template.id);
  };

  const getSportTypeFromTemplate = (template: NonNullable<IFriendlyMatchConfig['templates']>[number]): SportType => {
    // Template settings içinde sportType varsa onu kullan
    return template.settings?.sportType || 'Futbol';
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Şablonlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Maç Şablonları</Text>
          <Text style={styles.headerSubtitle}>
            {templates.length} şablon
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCreateTemplate}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#16a34a" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Zap size={18} color="#F59E0B" strokeWidth={2} />
        <Text style={styles.infoBannerText}>
          Şablonlar ile sık kullandığınız maç ayarlarını kaydedin ve hızlıca yeni maç oluşturun
        </Text>
      </View>

      {/* Templates List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        {templates.length > 0 ? (
          templates.map(({ template, usageCount, lastUsed }) => {
            const sportType = getSportTypeFromTemplate(template);
            const sportColor = getSportColor(sportType);

            return (
              <View key={template.id} style={styles.templateCard}>
                {/* Header */}
                <View style={styles.templateHeader}>
                  <View style={styles.templateHeaderLeft}>
                    <View style={[styles.sportIcon, { backgroundColor: sportColor + '20' }]}>
                      <Text style={styles.sportEmoji}>{getSportIcon(sportType)}</Text>
                    </View>
                    <View style={styles.templateHeaderInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <View style={styles.templateMetaRow}>
                        <View style={styles.usageBadge}>
                          <TrendingUp size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.usageText}>
                            {usageCount} kez kullanıldı
                          </Text>
                        </View>
                        {lastUsed && (
                          <Text style={styles.lastUsedText}>
                            Son: {new Date(lastUsed).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.templateDetails}>
                  {template.settings?.location && (
                    <View style={styles.detailItem}>
                      <MapPin size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {template.settings.location}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Users size={16} color="#3B82F6" strokeWidth={2} />
                      <Text style={styles.detailText}>
                        {template.settings?.staffPlayerCount || 10} + {template.settings?.reservePlayerCount || 2} yedek
                      </Text>
                    </View>

                    {template.settings?.matchTotalTimeInMinute && (
                      <View style={styles.detailItem}>
                        <Clock size={16} color="#8B5CF6" strokeWidth={2} />
                        <Text style={styles.detailText}>
                          {template.settings.matchTotalTimeInMinute} dk
                        </Text>
                      </View>
                    )}
                  </View>

                  {template.settings?.pricePerPlayer !== undefined && (
                    <View style={styles.detailItem}>
                      <DollarSign size={16} color="#10B981" strokeWidth={2} />
                      <Text style={styles.detailText}>
                        {template.settings.pricePerPlayer} TL / Kişi
                      </Text>
                    </View>
                  )}

                  {/* Favorite Players */}
                  {template.settings?.directPlayerIds && template.settings.directPlayerIds.length > 0 && (
                    <View style={styles.favoritesSection}>
                      <View style={styles.favoritesHeader}>
                        <Star size={14} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.favoritesText}>
                          {template.settings.directPlayerIds.length} favori oyuncu
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Quick Create Button */}
                <TouchableOpacity
                  style={[styles.quickCreateButton, { backgroundColor: sportColor }]}
                  onPress={() => handleQuickCreate(template)}
                  activeOpacity={0.7}
                >
                  <Calendar size={18} color="white" strokeWidth={2} />
                  <Text style={styles.quickCreateText}>Hızlı Maç Oluştur</Text>
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.templateActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    <Edit size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Düzenle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDuplicateTemplate(template)}
                    activeOpacity={0.7}
                  >
                    <Copy size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Kopyala</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShareTemplate(template)}
                    activeOpacity={0.7}
                  >
                    <Share2 size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Paylaş</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => handleDeleteTemplate(template.id, template.name)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Henüz şablon yok</Text>
            <Text style={styles.emptyText}>
              Sık kullandığınız maç ayarlarını şablon olarak kaydedin ve hızlıca yeni maç oluşturun
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleCreateTemplate}
              activeOpacity={0.7}
            >
              <Plus size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.emptyActionButtonText}>İlk Şablonu Oluştur</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      {templates.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateTemplate}
          activeOpacity={0.8}
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  templateHeader: {
    marginBottom: 16,
  },
  templateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 24,
  },
  templateHeaderInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  templateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  usageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  lastUsedText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  templateDetails: {
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  favoritesSection: {
    marginTop: 4,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favoritesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  quickCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickCreateText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDanger: {
    flex: 0,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSpacing: {
    height: 80,
  },
});