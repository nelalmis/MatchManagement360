// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     FlatList,
//     TouchableOpacity,
//     Alert,
//     ActivityIndicator,
//     RefreshControl,
//     Share,
// } from 'react-native';
// import {
//     X,
//     Plus,
//     Copy,
//     Share2,
//     Eye,
//     Users,
//     Calendar,
//     MoreVertical,
//     Power,
//     PowerOff,
//     Trash2,
// } from 'lucide-react-native';
// import { ILeagueInvitation } from '../../types/entity/types';
// import { NavigationService } from '../../navigation/NavigationService';
// import { useAuth } from '../../hooks';
// import * as Clipboard from 'expo-clipboard';
// import LeagueInvitationService from '../../services/serviceLayer/LeagueInvitationService';
// import { ManageLeagueInvitationsRouteProp, useRoute } from '../../navigation';
// import { CustomHeader } from '../../components/CustomHeader';


// export const ManageLeagueInvitationsScreen: React.FC = () => {
//     const { user } = useAuth();
//     const route = useRoute<ManageLeagueInvitationsRouteProp>();
//     const { leagueId, leagueTitle } = route.params;

//     // State
//     const [invitations, setInvitations] = useState<ILeagueInvitation[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [selectedInvite, setSelectedInvite] = useState<string | null>(null);

//     // ============================================
//     // LOAD INVITATIONS
//     // ============================================
//     useEffect(() => {
//         loadInvitations();
//     }, []);

//     const loadInvitations = async () => {
//         if (!user?.id) return;

//         try {
//             setLoading(true);
//             const result = await LeagueInvitationService.getLeagueInvitations(leagueId, user.id);

//             if (result.success && result.data) {
//                 setInvitations(result.data);
//             } else {
//                 Alert.alert('Hata', result.error?.message || 'Davet kodları yüklenemedi');
//             }
//         } catch (error) {
//             console.error('Error loading invitations:', error);
//             Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleRefresh = async () => {
//         setRefreshing(true);
//         await loadInvitations();
//         setRefreshing(false);
//     };

//     // ============================================
//     // ACTIONS
//     // ============================================
//     const handleCreateNew = () => {
//         NavigationService.navigateToCreateLeagueInvitation(leagueId, leagueTitle);
//     };

//     const handleCopyCode = async (code: string) => {
//         await Clipboard.setStringAsync(code);
//         Alert.alert('Kopyalandı', 'Davet kodu panoya kopyalandı');
//     };

//     const handleShareInvite = async (invite: ILeagueInvitation) => {
//         try {
//             await Share.share({
//                 message: `🏆 ${leagueTitle} ligine katıl!\n\nDavet Kodu: ${invite.code}\nLink: ${invite.inviteLink}`,
//                 title: 'Lig Daveti',
//             });
//         } catch (error) {
//             console.error('Error sharing:', error);
//         }
//     };

//     const handleToggleActive = async (invite: ILeagueInvitation) => {
//         if (!user?.id) return;

//         const action = invite.isActive ? 'devre dışı bırakmak' : 'aktif etmek';

//         Alert.alert(
//             'Onay',
//             `Bu davet kodunu ${action} istediğinize emin misiniz?`,
//             [
//                 { text: 'İptal', style: 'cancel' },
//                 {
//                     text: 'Evet',
//                     onPress: async () => {
//                         try {
//                             const result = invite.isActive
//                                 ? await LeagueInvitationService.deactivateInvite(invite.id!, user.id)
//                                 : await LeagueInvitationService.reactivateInvite(invite.id!, user.id);

//                             if (result.success) {
//                                 Alert.alert('Başarılı', `Davet kodu ${invite.isActive ? 'devre dışı bırakıldı' : 'aktif edildi'}`);
//                                 loadInvitations();
//                             } else {
//                                 Alert.alert('Hata', result.error?.message || 'İşlem başarısız');
//                             }
//                         } catch (error) {
//                             console.error('Error toggling invite:', error);
//                             Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
//                         } finally {
//                             setSelectedInvite(null);
//                         }
//                     },
//                 },
//             ]
//         );
//     };

//     const handleDelete = async (invite: ILeagueInvitation) => {
//         if (!user?.id) return;

//         Alert.alert(
//             'Onay',
//             'Bu davet kodunu kalıcı olarak silmek istediğinize emin misiniz?',
//             [
//                 { text: 'İptal', style: 'cancel' },
//                 {
//                     text: 'Sil',
//                     style: 'destructive',
//                     onPress: async () => {
//                         try {
//                             const result = await LeagueInvitationService.deleteInvite(invite.id!, user.id);

//                             if (result.success) {
//                                 Alert.alert('Başarılı', 'Davet kodu silindi');
//                                 loadInvitations();
//                             } else {
//                                 Alert.alert('Hata', result.error?.message || 'Silme işlemi başarısız');
//                             }
//                         } catch (error) {
//                             console.error('Error deleting invite:', error);
//                             Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
//                         } finally {
//                             setSelectedInvite(null);
//                         }
//                     },
//                 },
//             ]
//         );
//     };

//     // ============================================
//     // RENDER INVITATION CARD
//     // ============================================
//     const renderInvitationCard = ({ item }: { item: ILeagueInvitation }) => {
//         const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
//         const isMaxedOut = item.maxUses && item.usedCount >= item.maxUses;
//         const isInactive = !item.isActive || isExpired || isMaxedOut;

//         return (
//             <View style={[styles.card, isInactive ? styles.cardInactive : null]}>
//                 {/* Header */}
//                 <View style={styles.cardHeader}>
//                     <View style={styles.codeContainer}>
//                         <Text style={[styles.code, isInactive ? styles.codeInactive : null]}>{item.code}</Text>
//                         <TouchableOpacity
//                             style={styles.copyIcon}
//                             onPress={() => handleCopyCode(item.code)}
//                             activeOpacity={0.7}
//                         >
//                             <Copy size={16} color={isInactive ? '#9CA3AF' : '#16a34a'} strokeWidth={2} />
//                         </TouchableOpacity>
//                     </View>

//                     <TouchableOpacity
//                         onPress={() => setSelectedInvite(selectedInvite === item.id ? null : item.id!)}
//                         style={styles.menuButton}
//                         activeOpacity={0.7}
//                     >
//                         <MoreVertical size={20} color="#6B7280" strokeWidth={2} />
//                     </TouchableOpacity>
//                 </View>

//                 {/* Status Badge */}
//                 <View style={styles.statusBadges}>
//                     {!item.isActive && (
//                         <View style={[styles.badge, styles.badgeInactive]}>
//                             <Text style={styles.badgeText}>Devre Dışı</Text>
//                         </View>
//                     )}
//                     {isExpired && (
//                         <View style={[styles.badge, styles.badgeExpired]}>
//                             <Text style={styles.badgeText}>Süresi Dolmuş</Text>
//                         </View>
//                     )}
//                     {isMaxedOut && (
//                         <View style={[styles.badge, styles.badgeMaxed]}>
//                             <Text style={styles.badgeText}>Limit Doldu</Text>
//                         </View>
//                     )}
//                     {item.isActive && !isExpired && !isMaxedOut && (
//                         <View style={[styles.badge, styles.badgeActive]}>
//                             <Text style={styles.badgeText}>Aktif</Text>
//                         </View>
//                     )}
//                 </View>

//                 {/* Description */}
//                 {item.metadata.description && (
//                     <Text style={styles.description}>{item.metadata.description}</Text>
//                 )}

//                 {/* Stats */}
//                 <View style={styles.stats}>
//                     <View style={styles.statItem}>
//                         <Eye size={14} color="#6B7280" strokeWidth={2} />
//                         <Text style={styles.statText}>{item.stats.totalViews} görüntüleme</Text>
//                     </View>

//                     <View style={styles.statItem}>
//                         <Users size={14} color="#6B7280" strokeWidth={2} />
//                         <Text style={styles.statText}>
//                             {item.usedCount} {item.maxUses ? `/ ${item.maxUses}` : ''} kullanım
//                         </Text>
//                     </View>
//                 </View>

//                 {/* Expiry Info */}
//                 {item.expiresAt && (
//                     <View style={styles.expiryInfo}>
//                         <Calendar size={14} color="#6B7280" strokeWidth={2} />
//                         <Text style={styles.expiryText}>
//                             {new Date(item.expiresAt).toLocaleDateString('tr-TR')} tarihine kadar
//                         </Text>
//                     </View>
//                 )}

//                 {/* Actions Menu */}
//                 {selectedInvite === item.id && (
//                     <View style={styles.actionsMenu}>
//                         <TouchableOpacity
//                             style={styles.actionButton}
//                             onPress={() => handleShareInvite(item)}
//                             activeOpacity={0.7}
//                         >
//                             <Share2 size={18} color="#6B7280" strokeWidth={2} />
//                             <Text style={styles.actionText}>Paylaş</Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={styles.actionButton}
//                             onPress={() => handleToggleActive(item)}
//                             activeOpacity={0.7}
//                         >
//                             {item.isActive ? (
//                                 <>
//                                     <PowerOff size={18} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.actionText}>Devre Dışı Bırak</Text>
//                                 </>
//                             ) : (
//                                 <>
//                                     <Power size={18} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.actionText}>Aktif Et</Text>
//                                 </>
//                             )}
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={styles.actionButton}
//                             onPress={() => handleDelete(item)}
//                             activeOpacity={0.7}
//                         >
//                             <Trash2 size={18} color="#EF4444" strokeWidth={2} />
//                             <Text style={[styles.actionText, styles.actionTextDanger]}>Sil</Text>
//                         </TouchableOpacity>
//                     </View>
//                 )}
//             </View>
//         );
//     };

//     // ============================================
//     // RENDER EMPTY STATE
//     // ============================================
//     const renderEmptyState = () => (
//         <View style={styles.emptyState}>
//             <View style={styles.emptyIcon}>
//                 <Share2 size={40} color="#D1D5DB" strokeWidth={2} />
//             </View>
//             <Text style={styles.emptyTitle}>Henüz Davet Kodu Yok</Text>
//             <Text style={styles.emptyText}>
//                 Yeni üye eklemek için davet kodu oluşturun
//             </Text>
//             <TouchableOpacity
//                 style={styles.emptyButton}
//                 onPress={handleCreateNew}
//                 activeOpacity={0.7}
//             >
//                 <Plus size={20} color="white" strokeWidth={2.5} />
//                 <Text style={styles.emptyButtonText}>İlk Davet Kodunu Oluştur</Text>
//             </TouchableOpacity>
//         </View>
//     );

//     // ============================================
//     // MAIN RENDER
//     // ============================================
//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#16a34a" />
//                 <Text style={styles.loadingText}>Yükleniyor...</Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             {/* Header */}
//             <CustomHeader
//                 title="Davet Kodları"
//                 showClose={true}
//                 onLeftPress={() => NavigationService.goBack()}
//                 showCreate={true}
//                 onCreatePress={handleCreateNew}
//                 subtitle={leagueTitle}
//             />

//             {/* Content */}
//             <FlatList
//                 data={invitations}
//                 keyExtractor={(item) => item.id!}
//                 renderItem={renderInvitationCard}
//                 contentContainerStyle={styles.listContent}
//                 ListEmptyComponent={renderEmptyState}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={refreshing}
//                         onRefresh={handleRefresh}
//                         tintColor="#16a34a"
//                     />
//                 }
//             />
//         </View>
//     );
// };

// // ============================================
// // STYLES
// // ============================================
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#F9FAFB',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#F9FAFB',
//     },
//     loadingText: {
//         marginTop: 12,
//         fontSize: 15,
//         color: '#6B7280',
//         fontWeight: '600',
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: 'white',
//         borderBottomWidth: 1,
//         borderBottomColor: '#E5E7EB',
//     },
//     headerButton: {
//         width: 40,
//         height: 40,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     headerCenter: {
//         alignItems: 'center',
//     },
//     headerTitle: {
//         fontSize: 17,
//         fontWeight: '700',
//         color: '#1F2937',
//     },
//     headerSubtitle: {
//         fontSize: 13,
//         color: '#6B7280',
//         marginTop: 2,
//     },
//     listContent: {
//         padding: 16,
//     },
//     card: {
//         backgroundColor: 'white',
//         borderRadius: 16,
//         padding: 16,
//         marginBottom: 12,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     cardInactive: {
//         opacity: 0.6,
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginBottom: 12,
//     },
//     codeContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//     },
//     code: {
//         fontSize: 20,
//         fontWeight: '800',
//         color: '#16a34a',
//         letterSpacing: 2,
//     },
//     codeInactive: {
//         color: '#9CA3AF',
//     },
//     copyIcon: {
//         padding: 4,
//     },
//     menuButton: {
//         padding: 4,
//     },
//     statusBadges: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 6,
//         marginBottom: 12,
//     },
//     badge: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     badgeActive: {
//         backgroundColor: '#DCFCE7',
//     },
//     badgeInactive: {
//         backgroundColor: '#F3F4F6',
//     },
//     badgeExpired: {
//         backgroundColor: '#FEE2E2',
//     },
//     badgeMaxed: {
//         backgroundColor: '#FEF3C7',
//     },
//     badgeText: {
//         fontSize: 11,
//         fontWeight: '700',
//         color: '#374151',
//     },
//     description: {
//         fontSize: 14,
//         color: '#6B7280',
//         marginBottom: 12,
//         lineHeight: 20,
//     },
//     stats: {
//         flexDirection: 'row',
//         gap: 16,
//         marginBottom: 8,
//     },
//     statItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     statText: {
//         fontSize: 13,
//         color: '#6B7280',
//     },
//     expiryInfo: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         marginTop: 4,
//     },
//     expiryText: {
//         fontSize: 12,
//         color: '#9CA3AF',
//         fontStyle: 'italic',
//     },
//     actionsMenu: {
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#F3F4F6',
//         gap: 4,
//     },
//     actionButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         paddingVertical: 10,
//         paddingHorizontal: 12,
//         borderRadius: 8,
//     },
//     actionText: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#374151',
//     },
//     actionTextDanger: {
//         color: '#EF4444',
//     },
//     emptyState: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingHorizontal: 32,
//         paddingTop: 100,
//     },
//     emptyIcon: {
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//         backgroundColor: '#F3F4F6',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 24,
//     },
//     emptyTitle: {
//         fontSize: 20,
//         fontWeight: '800',
//         color: '#1F2937',
//         marginBottom: 8,
//     },
//     emptyText: {
//         fontSize: 14,
//         color: '#6B7280',
//         textAlign: 'center',
//         lineHeight: 20,
//         marginBottom: 24,
//     },
//     emptyButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         paddingVertical: 14,
//         paddingHorizontal: 24,
//         borderRadius: 12,
//         backgroundColor: '#16a34a',
//     },
//     emptyButtonText: {
//         fontSize: 15,
//         fontWeight: '700',
//         color: 'white',
//     },
// });