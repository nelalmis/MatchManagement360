// import React, { useState } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     TextInput,
//     TouchableOpacity,
//     Alert,
//     ActivityIndicator,
//     Switch,
//     Share,
// } from 'react-native';
// import {
//     X,
//     Check,
//     Copy,
//     Share2,
//     Calendar,
//     Users,
//     Tag,
//     Info,
// } from 'lucide-react-native';
// import { ILeagueInvitation } from '../../types/entity/types';
// import { NavigationService } from '../../navigation/NavigationService';
// import { useAuth } from '../../hooks';
// import * as Clipboard from 'expo-clipboard';
// import LeagueInvitationService from '../../services/serviceLayer/LeagueInvitationService';
// import { CreateLeagueInvitationRouteProp, useRoute } from '../../navigation';
// import { CustomHeader } from '../../components/CustomHeader';

// export const CreateLeagueInvitationScreen: React.FC = () => {
//     const { user } = useAuth();
//     const route = useRoute<CreateLeagueInvitationRouteProp>();

//     const { leagueId, leagueTitle } = route.params;

//     // Form State
//     const [description, setDescription] = useState('');
//     const [hasExpiry, setHasExpiry] = useState(false);
//     const [expiryDays, setExpiryDays] = useState('30');
//     const [hasMaxUses, setHasMaxUses] = useState(false);
//     const [maxUses, setMaxUses] = useState('50');
//     const [assignRole, setAssignRole] = useState<'member' | 'premium' | 'direct'>('member');

//     // UI State
//     const [loading, setLoading] = useState(false);
//     const [generatedInvite, setGeneratedInvite] = useState<ILeagueInvitation | null>(null);

//     // ============================================
//     // GENERATE INVITATION
//     // ============================================
//     const handleGenerateInvite = async () => {
//         if (!user?.id) return;

//         try {
//             setLoading(true);

//             const result = await LeagueInvitationService.generateInvite({
//                 leagueId,
//                 creatorId: user.id,
//                 description: description.trim() || undefined,
//                 assignRole,
//                 expiresInDays: hasExpiry ? parseInt(expiryDays) : undefined,
//                 maxUses: hasMaxUses ? parseInt(maxUses) : undefined,
//             });

//             if (result.success && result.data) {
//                 setGeneratedInvite(result.data);
//                 Alert.alert('Başarılı! 🎉', 'Davet kodu oluşturuldu');
//             } else {
//                 Alert.alert('Hata', result.error?.message || 'Davet kodu oluşturulamadı');
//             }
//         } catch (error) {
//             console.error('Error generating invite:', error);
//             Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ============================================
//     // SHARE FUNCTIONS
//     // ============================================
//     const handleCopyCode = async () => {
//         if (!generatedInvite) return;
//         await Clipboard.setStringAsync(generatedInvite.code);
//         Alert.alert('Kopyalandı', 'Davet kodu panoya kopyalandı');
//     };

//     const handleCopyLink = async () => {
//         if (!generatedInvite) return;
//         await Clipboard.setStringAsync(generatedInvite.inviteLink);
//         Alert.alert('Kopyalandı', 'Davet linki panoya kopyalandı');
//     };

//     const handleShareInvite = async () => {
//         if (!generatedInvite) return;

//         try {
//             await Share.share({
//                 message: `${leagueTitle} ligine katıl!\n\nDavet Kodu: ${generatedInvite.code}\nLink: ${generatedInvite.inviteLink}`,
//                 title: 'Lig Daveti',
//             });
//         } catch (error) {
//             console.error('Error sharing:', error);
//         }
//     };

//     const handleDone = () => {
//         NavigationService.goBack();
//     };

//     // ============================================
//     // VALIDATION
//     // ============================================
//     const isFormValid = (): boolean => {
//         if (hasExpiry) {
//             const days = parseInt(expiryDays);
//             if (isNaN(days) || days < 1 || days > 365) return false;
//         }
//         if (hasMaxUses) {
//             const uses = parseInt(maxUses);
//             if (isNaN(uses) || uses < 1 || uses > 1000) return false;
//         }
//         return true;
//     };

//     // ============================================
//     // RENDER
//     // ============================================
//     if (generatedInvite) {
//         return (
//             <View style={styles.container}>
//                 {/* Header */}
//                 <CustomHeader
//                     title="Davet Kodu Oluşturuldu"
//                     showClose={true}
//                     onLeftPress={handleDone}
//                 />

//                 <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//                     {/* Success Message */}
//                     <View style={styles.successBox}>
//                         <View style={styles.successIcon}>
//                             <Check size={32} color="#16a34a" strokeWidth={3} />
//                         </View>
//                         <Text style={styles.successTitle}>Davet Kodu Hazır!</Text>
//                         <Text style={styles.successText}>
//                             Bu kodu paylaşarak yeni üyeleri lige davet edebilirsiniz
//                         </Text>
//                     </View>

//                     {/* Code Display */}
//                     <View style={styles.codeSection}>
//                         <Text style={styles.sectionTitle}>Davet Kodu</Text>
//                         <View style={styles.codeBox}>
//                             <Text style={styles.codeText}>{generatedInvite.code}</Text>
//                             <TouchableOpacity
//                                 style={styles.copyButton}
//                                 onPress={handleCopyCode}
//                                 activeOpacity={0.7}
//                             >
//                                 <Copy size={20} color="#16a34a" strokeWidth={2} />
//                             </TouchableOpacity>
//                         </View>
//                     </View>

//                     {/* Link Display */}
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Davet Linki</Text>
//                         <View style={styles.linkBox}>
//                             <Text style={styles.linkText} numberOfLines={1}>
//                                 {generatedInvite.inviteLink}
//                             </Text>
//                             <TouchableOpacity
//                                 style={styles.copyButton}
//                                 onPress={handleCopyLink}
//                                 activeOpacity={0.7}
//                             >
//                                 <Copy size={20} color="#16a34a" strokeWidth={2} />
//                             </TouchableOpacity>
//                         </View>
//                     </View>

//                     {/* Invitation Details */}
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Detaylar</Text>
//                         <View style={styles.detailsBox}>
//                             {generatedInvite.metadata.description && (
//                                 <View style={styles.detailRow}>
//                                     <Tag size={16} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.detailText}>{generatedInvite.metadata.description}</Text>
//                                 </View>
//                             )}

//                             {generatedInvite.metadata.assignRole && (
//                                 <View style={styles.detailRow}>
//                                     <Users size={16} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.detailText}>
//                                         Rol:{' '}
//                                         {generatedInvite.metadata.assignRole === 'premium'
//                                             ? 'Premium Oyuncu'
//                                             : generatedInvite.metadata.assignRole === 'direct'
//                                                 ? 'Direkt Oyuncu'
//                                                 : 'Üye'}
//                                     </Text>
//                                 </View>
//                             )}

//                             {generatedInvite.expiresAt && (
//                                 <View style={styles.detailRow}>
//                                     <Calendar size={16} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.detailText}>
//                                         Geçerlilik: {new Date(generatedInvite.expiresAt).toLocaleDateString('tr-TR')}
//                                     </Text>
//                                 </View>
//                             )}

//                             {generatedInvite.maxUses && (
//                                 <View style={styles.detailRow}>
//                                     <Users size={16} color="#6B7280" strokeWidth={2} />
//                                     <Text style={styles.detailText}>
//                                         Maks. Kullanım: {generatedInvite.maxUses}
//                                     </Text>
//                                 </View>
//                             )}
//                         </View>
//                     </View>

//                     {/* Info Box */}
//                     <View style={styles.infoBox}>
//                         <Info size={20} color="#1E40AF" strokeWidth={2} />
//                         <View style={styles.infoBoxContent}>
//                             <Text style={styles.infoBoxText}>
//                                 Bu davet kodunu lig yönetim panelinden istediğiniz zaman devre dışı bırakabilirsiniz
//                             </Text>
//                         </View>
//                     </View>
//                 </ScrollView>

//                 {/* Bottom Actions */}
//                 <View style={styles.bottomActions}>
//                     <TouchableOpacity
//                         style={styles.shareButton}
//                         onPress={handleShareInvite}
//                         activeOpacity={0.7}
//                     >
//                         <Share2 size={20} color="white" strokeWidth={2.5} />
//                         <Text style={styles.shareButtonText}>Paylaş</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                         style={styles.doneButton}
//                         onPress={handleDone}
//                         activeOpacity={0.7}
//                     >
//                         <Text style={styles.doneButtonText}>Tamam</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <CustomHeader
//                 title="Davet Kodu Oluştur"
//                 showClose={true}
//                 onLeftPress={() => NavigationService.goBack()}
//             />

//             <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//                 {/* League Info */}
//                 <View style={styles.leagueInfo}>
//                     <Text style={styles.leagueLabel}>Lig</Text>
//                     <Text style={styles.leagueTitle}>{leagueTitle}</Text>
//                 </View>

//                 {/* Description */}
//                 <View style={styles.section}>
//                     <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
//                     <TextInput
//                         style={styles.textArea}
//                         placeholder="Örn: Sezon başı davet, Özel turnuva..."
//                         value={description}
//                         onChangeText={setDescription}
//                         maxLength={100}
//                         multiline
//                         numberOfLines={3}
//                         textAlignVertical="top"
//                     />
//                     <Text style={styles.charCount}>{description.length}/100</Text>
//                 </View>

//                 {/* Assign Role */}
//                 <View style={styles.section}>
//                     <Text style={styles.label}>Otomatik Rol Ataması</Text>
//                     <View style={styles.roleButtons}>
//                         <TouchableOpacity
//                             style={[styles.roleButton, assignRole === 'member' && styles.roleButtonActive]}
//                             onPress={() => setAssignRole('member')}
//                             activeOpacity={0.7}
//                         >
//                             <Text
//                                 style={[
//                                     styles.roleButtonText,
//                                     assignRole === 'member' && styles.roleButtonTextActive,
//                                 ]}
//                             >
//                                 Üye
//                             </Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={[styles.roleButton, assignRole === 'premium' && styles.roleButtonActive]}
//                             onPress={() => setAssignRole('premium')}
//                             activeOpacity={0.7}
//                         >
//                             <Text
//                                 style={[
//                                     styles.roleButtonText,
//                                     assignRole === 'premium' && styles.roleButtonTextActive,
//                                 ]}
//                             >
//                                 Premium
//                             </Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={[styles.roleButton, assignRole === 'direct' && styles.roleButtonActive]}
//                             onPress={() => setAssignRole('direct')}
//                             activeOpacity={0.7}
//                         >
//                             <Text
//                                 style={[
//                                     styles.roleButtonText,
//                                     assignRole === 'direct' && styles.roleButtonTextActive,
//                                 ]}
//                             >
//                                 Direkt
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                     <Text style={styles.helpText}>
//                         {assignRole === 'premium'
//                             ? 'Kayıt olduğunda öncelikli kadroya alınır'
//                             : assignRole === 'direct'
//                                 ? 'Otomatik kadroya dahil edilir'
//                                 : 'Normal üye olarak katılır'}
//                     </Text>
//                 </View>

//                 {/* Expiry Date */}
//                 <View style={styles.section}>
//                     <View style={styles.settingRow}>
//                         <View style={styles.settingInfo}>
//                             <Text style={styles.settingLabel}>Geçerlilik Süresi</Text>
//                             <Text style={styles.settingDesc}>Kodun kullanım süresi sınırlı olsun</Text>
//                         </View>
//                         <Switch
//                             value={hasExpiry}
//                             onValueChange={setHasExpiry}
//                             trackColor={{ false: '#D1D5DB', true: '#86efac' }}
//                             thumbColor={hasExpiry ? '#16a34a' : '#f4f3f4'}
//                         />
//                     </View>

//                     {hasExpiry && (
//                         <View style={styles.inputRow}>
//                             <Text style={styles.inputLabel}>Geçerlilik (Gün)</Text>
//                             <TextInput
//                                 style={styles.inputSmall}
//                                 value={expiryDays}
//                                 onChangeText={setExpiryDays}
//                                 keyboardType="number-pad"
//                                 maxLength={3}
//                                 placeholder="30"
//                             />
//                         </View>
//                     )}
//                 </View>

//                 {/* Max Uses */}
//                 <View style={styles.section}>
//                     <View style={styles.settingRow}>
//                         <View style={styles.settingInfo}>
//                             <Text style={styles.settingLabel}>Kullanım Limiti</Text>
//                             <Text style={styles.settingDesc}>Kod kaç kez kullanılabilsin</Text>
//                         </View>
//                         <Switch
//                             value={hasMaxUses}
//                             onValueChange={setHasMaxUses}
//                             trackColor={{ false: '#D1D5DB', true: '#86efac' }}
//                             thumbColor={hasMaxUses ? '#16a34a' : '#f4f3f4'}
//                         />
//                     </View>

//                     {hasMaxUses && (
//                         <View style={styles.inputRow}>
//                             <Text style={styles.inputLabel}>Maksimum Kullanım</Text>
//                             <TextInput
//                                 style={styles.inputSmall}
//                                 value={maxUses}
//                                 onChangeText={setMaxUses}
//                                 keyboardType="number-pad"
//                                 maxLength={4}
//                                 placeholder="50"
//                             />
//                         </View>
//                     )}
//                 </View>

//                 {/* Info Box */}
//                 <View style={styles.infoBox}>
//                     <Info size={20} color="#1E40AF" strokeWidth={2} />
//                     <View style={styles.infoBoxContent}>
//                         <Text style={styles.infoBoxText}>
//                             Davet kodu oluşturduktan sonra WhatsApp, SMS veya sosyal medya üzerinden
//                             paylaşabilirsiniz
//                         </Text>
//                     </View>
//                 </View>

//                 <View style={styles.bottomSpacing} />
//             </ScrollView>

//             {/* Bottom Button */}
//             <View style={styles.bottomNav}>
//                 <TouchableOpacity
//                     style={[
//                         styles.generateButton,
//                         (!isFormValid() || loading) && styles.generateButtonDisabled,
//                     ]}
//                     onPress={handleGenerateInvite}
//                     disabled={!isFormValid() || loading}
//                     activeOpacity={0.7}
//                 >
//                     {loading ? (
//                         <ActivityIndicator size="small" color="white" />
//                     ) : (
//                         <>
//                             <Check size={20} color="white" strokeWidth={2.5} />
//                             <Text style={styles.generateButtonText}>Davet Kodu Oluştur</Text>
//                         </>
//                     )}
//                 </TouchableOpacity>
//             </View>
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
//     headerTitle: {
//         fontSize: 17,
//         fontWeight: '700',
//         color: '#1F2937',
//     },
//     content: {
//         flex: 1,
//     },
//     leagueInfo: {
//         backgroundColor: '#F0FDF4',
//         padding: 16,
//         marginBottom: 16,
//     },
//     leagueLabel: {
//         fontSize: 12,
//         fontWeight: '600',
//         color: '#16a34a',
//         marginBottom: 4,
//     },
//     leagueTitle: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: '#16a34a',
//     },
//     section: {
//         padding: 16,
//     },
//     label: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#374151',
//         marginBottom: 8,
//     },
//     textArea: {
//         backgroundColor: 'white',
//         borderWidth: 1.5,
//         borderColor: '#E5E7EB',
//         borderRadius: 12,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         fontSize: 15,
//         color: '#1F2937',
//         minHeight: 80,
//     },
//     charCount: {
//         fontSize: 12,
//         color: '#9CA3AF',
//         textAlign: 'right',
//         marginTop: 6,
//     },
//     roleButtons: {
//         flexDirection: 'row',
//         gap: 8,
//     },
//     roleButton: {
//         flex: 1,
//         paddingVertical: 12,
//         borderRadius: 10,
//         backgroundColor: 'white',
//         borderWidth: 1.5,
//         borderColor: '#E5E7EB',
//         alignItems: 'center',
//     },
//     roleButtonActive: {
//         backgroundColor: '#DCFCE7',
//         borderColor: '#16a34a',
//     },
//     roleButtonText: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#6B7280',
//     },
//     roleButtonTextActive: {
//         color: '#16a34a',
//         fontWeight: '700',
//     },
//     helpText: {
//         fontSize: 12,
//         color: '#6B7280',
//         marginTop: 8,
//         fontStyle: 'italic',
//     },
//     settingRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: 'white',
//         borderRadius: 12,
//         padding: 16,
//     },
//     settingInfo: {
//         flex: 1,
//         marginRight: 12,
//     },
//     settingLabel: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#1F2937',
//     },
//     settingDesc: {
//         fontSize: 13,
//         color: '#6B7280',
//         marginTop: 2,
//     },
//     inputRow: {
//         backgroundColor: 'white',
//         borderRadius: 12,
//         padding: 16,
//         marginTop: 12,
//     },
//     inputLabel: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#374151',
//         marginBottom: 8,
//     },
//     inputSmall: {
//         backgroundColor: '#F9FAFB',
//         borderWidth: 1.5,
//         borderColor: '#E5E7EB',
//         borderRadius: 10,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#1F2937',
//     },
//     infoBox: {
//         flexDirection: 'row',
//         backgroundColor: '#EFF6FF',
//         borderRadius: 12,
//         padding: 12,
//         marginHorizontal: 16,
//         gap: 10,
//     },
//     infoBoxContent: {
//         flex: 1,
//     },
//     infoBoxText: {
//         fontSize: 13,
//         color: '#1E40AF',
//         lineHeight: 18,
//     },
//     bottomSpacing: {
//         height: 20,
//     },
//     bottomNav: {
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: 'white',
//         borderTopWidth: 1,
//         borderTopColor: '#E5E7EB',
//     },
//     generateButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         paddingVertical: 14,
//         borderRadius: 12,
//         backgroundColor: '#16a34a',
//     },
//     generateButtonDisabled: {
//         opacity: 0.6,
//     },
//     generateButtonText: {
//         fontSize: 15,
//         fontWeight: '700',
//         color: 'white',
//     },
//     successBox: {
//         alignItems: 'center',
//         padding: 24,
//         margin: 16,
//         backgroundColor: 'white',
//         borderRadius: 16,
//     },
//     successIcon: {
//         width: 64,
//         height: 64,
//         borderRadius: 32,
//         backgroundColor: '#DCFCE7',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     successTitle: {
//         fontSize: 22,
//         fontWeight: '800',
//         color: '#1F2937',
//         marginBottom: 8,
//     },
//     successText: {
//         fontSize: 14,
//         color: '#6B7280',
//         textAlign: 'center',
//         lineHeight: 20,
//     },
//     codeSection: {
//         padding: 16,
//     },
//     sectionTitle: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#374151',
//         marginBottom: 8,
//     },
//     codeBox: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: '#F0FDF4',
//         borderRadius: 12,
//         padding: 16,
//         borderWidth: 2,
//         borderColor: '#16a34a',
//     },
//     codeText: {
//         fontSize: 28,
//         fontWeight: '800',
//         color: '#16a34a',
//         letterSpacing: 2,
//     },
//     copyButton: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: 'white',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     linkBox: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: 'white',
//         borderRadius: 12,
//         padding: 16,
//         borderWidth: 1.5,
//         borderColor: '#E5E7EB',
//     },
//     linkText: {
//         flex: 1,
//         fontSize: 13,
//         color: '#6B7280',
//         fontFamily: 'monospace',
//     },
//     detailsBox: {
//         backgroundColor: 'white',
//         borderRadius: 12,
//         padding: 16,
//         gap: 12,
//     },
//     detailRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//     },
//     detailText: {
//         fontSize: 14,
//         color: '#1F2937',
//     },
//     bottomActions: {
//         flexDirection: 'row',
//         gap: 12,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: 'white',
//         borderTopWidth: 1,
//         borderTopColor: '#E5E7EB',
//     },
//     shareButton: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         paddingVertical: 14,
//         borderRadius: 12,
//         backgroundColor: '#16a34a',
//     },
//     shareButtonText: {
//         fontSize: 15,
//         fontWeight: '700',
//         color: 'white',
//     },
//     doneButton: {
//         paddingHorizontal: 24,
//         paddingVertical: 14,
//         borderRadius: 12,
//         backgroundColor: '#F3F4F6',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     doneButtonText: {
//         fontSize: 15,
//         fontWeight: '700',
//         color: '#4B5563',
//     },
// });