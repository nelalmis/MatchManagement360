// // screens/Match/CreateFriendlyMatchScreen.tsx

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Switch,
//   Alert,
//   ActivityIndicator,
//   Modal,
//   Platform,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import {
//   ChevronLeft,
//   Plus,
//   Calendar,
//   Clock,
//   MapPin,
//   DollarSign,
//   Users,
//   FileText,
//   Search,
//   Star,
//   Check,
//   Settings as SettingsIcon,
//   Send,
//   Save,
//   Info,
//   Sparkles,
// } from 'lucide-react-native';
// import { useNavigation } from '@react-navigation/native';
// import { useAppContext } from '../../context/AppContext';
// import { NavigationService } from '../../navigation/NavigationService';
// import { eventManager, Events } from '../../utils';
// import { friendlyMatchConfigService } from '../../services/friendlyMatchConfigService';
// import { playerService } from '../../services/playerService';
// import { matchService } from '../../services/matchService';
// import { notificationService } from '../../services/notificationService';
// import { 
//   IPlayer, 
//   IFriendlyMatchTemplate,
//   SportType, 
//   SPORT_CONFIGS, 
//   getSportIcon, 
//   getSportColor 
// } from '../../types/types';

// interface PlayerSelection extends IPlayer {
//   selected: boolean;
//   isFavorite: boolean;
// }

// export const CreateFriendlyMatchScreen: React.FC = () => {
//   const { goBack } = useNavigation();
//   const { user } = useAppContext();

//   // Loading States
//   const [loading, setLoading] = useState(true);
//   const [creating, setCreating] = useState(false);

//   // Templates
//   const [templates, setTemplates] = useState<IFriendlyMatchTemplate[]>([]);
//   const [selectedTemplate, setSelectedTemplate] = useState<IFriendlyMatchTemplate | null>(null);
//   const [showTemplateModal, setShowTemplateModal] = useState(false);

//   // Match Details
//   const [matchDate, setMatchDate] = useState(new Date());
//   const [matchTime, setMatchTime] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [selectedSport, setSelectedSport] = useState<SportType>('Futbol');
//   const [venue, setVenue] = useState('');
//   const [costPerPlayer, setCostPerPlayer] = useState('');
//   const [description, setDescription] = useState('');
//   const [staffCount, setStaffCount] = useState('10');
//   const [reserveCount, setReserveCount] = useState('2');

//   // Settings
//   const [affectsStandings, setAffectsStandings] = useState(false);
//   const [affectsStats, setAffectsStats] = useState(true);
//   const [isPublic, setIsPublic] = useState(true);
//   const [autoAccept, setAutoAccept] = useState(false);

//   // Payment Info
//   const [peterIban, setPeterIban] = useState('');
//   const [peterFullName, setPeterFullName] = useState('');

//   // Player Selection
//   const [allPlayers, setAllPlayers] = useState<PlayerSelection[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showPlayerModal, setShowPlayerModal] = useState(false);
//   const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

//   // Save as Template
//   const [saveAsTemplate, setSaveAsTemplate] = useState(false);
//   const [templateName, setTemplateName] = useState('');

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);

//       // Load templates
//       const config = await friendlyMatchConfigService.getConfig(user!.id!);
//       if (config?.templates) {
//         setTemplates(config.templates);
//       }

//       // Load players
//       const players = await playerService.getAll();
//       const playerSelections: PlayerSelection[] = players
//         .filter((p: any) => p.id !== user!.id)
//         .map((player: any) => ({
//           ...player,
//           selected: false,
//           isFavorite: config?.favoritePlayerIds?.includes(player.id!) || false,
//         }));
//       setAllPlayers(playerSelections);

//       // Load default settings from config
//       if (config?.defaultSettings) {
//         const settings = config.defaultSettings;
//         setSelectedSport(settings.sportType || 'Futbol');
//         setVenue(settings.location || '');
//         setCostPerPlayer(settings.pricePerPlayer?.toString() || '');
//         setStaffCount(settings.staffPlayerCount?.toString() || '10');
//         setReserveCount(settings.reservePlayerCount?.toString() || '2');
//         setAffectsStandings(settings.affectsStandings || false);
//         setAffectsStats(settings.affectsStats !== false);
//         setIsPublic(settings.isPublic !== false);
//         setPeterIban(settings.peterIban || '');
//         setPeterFullName(settings.peterFullName || '');
//       }

//     } catch (error) {
//       console.error('Error loading data:', error);
//       Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadTemplate = (template: IFriendlyMatchTemplate) => {
//     setSelectedTemplate(template);
//     const settings = template.settings;

//     setSelectedSport(settings?.sportType || 'Futbol');
//     setVenue(settings?.location || '');
//     setCostPerPlayer(settings?.pricePerPlayer?.toString() || '');
//     setStaffCount(settings?.staffPlayerCount?.toString() || '10');
//     setReserveCount(settings?.reservePlayerCount?.toString() || '2');
//     setAffectsStandings(settings?.affectsStandings || false);
//     setAffectsStats(settings?.affectsStats !== false);
//     setIsPublic(settings?.isPublic !== false);
//     setPeterIban(settings?.peterIban || '');
//     setPeterFullName(settings?.peterFullName || '');

//     // Load invited players
//     if (settings?.invitedPlayerIds && settings.invitedPlayerIds.length > 0) {
//       setSelectedPlayers(settings.invitedPlayerIds);
//       setAllPlayers((prev) =>
//         prev.map((p) => ({
//           ...p,
//           selected: settings.invitedPlayerIds?.includes(p.id!) || false,
//         }))
//       );
//     }

//     setShowTemplateModal(false);
//     Alert.alert('Başarılı', `"${template.name}" şablonu yüklendi`);
//   };

//   const resetToDefaults = () => {
//     setSelectedTemplate(null);
//     setSelectedPlayers([]);
//     setAllPlayers((prev) => prev.map((p) => ({ ...p, selected: false })));
//     loadData(); // Reload default settings
//   };

//   const handleCreate = async () => {
//     // Validation
//     if (!venue.trim()) {
//       Alert.alert('Hata', 'Lütfen saha adı girin');
//       return;
//     }

//     if (selectedPlayers.length === 0) {
//       Alert.alert('Hata', 'Lütfen en az bir oyuncu seçin');
//       return;
//     }

//     try {
//       setCreating(true);

//       // Combine date and time
//       const matchDateTime = new Date(matchDate);
//       matchDateTime.setHours(matchTime.getHours());
//       matchDateTime.setMinutes(matchTime.getMinutes());

//       // Create match data
//       const matchData = {
//         date: matchDateTime.toISOString(),
//         location: venue,
//         sportType: selectedSport,
//         pricePerPlayer: parseFloat(costPerPlayer) || 0,
//         staffPlayerCount: parseInt(staffCount) || 10,
//         reservePlayerCount: parseInt(reserveCount) || 2,
//         description: description.trim() || undefined,
//         affectsStandings,
//         affectsStats,
//         isPublic,
//         autoAcceptInvitations: autoAccept,
//         invitedPlayerIds: selectedPlayers,
//         peterIban: peterIban.trim() || undefined,
//         peterFullName: peterFullName.trim() || undefined,
//         createdBy: user!.id!,
//         isFriendly: true,
//       };

//       // Create match
//       const newMatch = await matchService.createFriendlyMatch(matchData);

//       // Save as template if requested
//       if (saveAsTemplate && templateName.trim()) {
//         try {
//           await friendlyMatchConfigService.addTemplate(user!.id!, {
//             name: templateName,
//             settings: {
//               sportType: selectedSport,
//               location: venue,
//               pricePerPlayer: parseFloat(costPerPlayer) || 0,
//               staffPlayerCount: parseInt(staffCount) || 10,
//               reservePlayerCount: parseInt(reserveCount) || 2,
//               affectsStandings,
//               affectsStats,
//               isPublic,
//               invitedPlayerIds: selectedPlayers,
//               peterIban: peterIban.trim() || undefined,
//               peterFullName: peterFullName.trim() || undefined,
//             },
//           });
//           eventManager.emit(Events.TEMPLATE_UPDATED);
//         } catch (error) {
//           console.error('Error saving template:', error);
//         }
//       }

//       // Send invitations
//       await sendInvitations(newMatch.id!);

//       Alert.alert(
//         'Başarılı!',
//         `Maç oluşturuldu ve ${selectedPlayers.length} oyuncuya davet gönderildi`,
//         [
//           {
//             text: 'Tamam',
//             onPress: () => {
//               eventManager.emit(Events.MATCH_CREATED);
//               NavigationService.goBack();
//             },
//           },
//         ]
//       );

//     } catch (error: any) {
//       console.error('Error creating match:', error);
//       Alert.alert('Hata', error.message || 'Maç oluşturulurken bir hata oluştu');
//     } finally {
//       setCreating(false);
//     }
//   };

//   const sendInvitations = async (matchId: string) => {
//     try {
//       const invitationPromises = selectedPlayers.map((playerId) =>
//         notificationService.sendMatchInvitation({
//           matchId,
//           playerId,
//           senderId: user!.id!,
//           matchDate: matchDate,
//           location: venue,
//           sportType: selectedSport,
//         })
//       );
//       await Promise.all(invitationPromises);
//     } catch (error) {
//       console.error('Error sending invitations:', error);
//     }
//   };

//   const togglePlayerSelection = (playerId: string) => {
//     setSelectedPlayers((prev) => {
//       if (prev.includes(playerId)) {
//         return prev.filter((id) => id !== playerId);
//       } else {
//         return [...prev, playerId];
//       }
//     });

//     setAllPlayers((prev) =>
//       prev.map((p) => (p.id === playerId ? { ...p, selected: !p.selected } : p))
//     );
//   };

//   const selectAllPlayers = () => {
//     const filteredPlayerIds = filteredPlayers.map((p) => p.id!);
//     setSelectedPlayers((prev) => {
//       const allSelected = filteredPlayerIds.every((id) => prev.includes(id));
//       if (allSelected) {
//         return prev.filter((id) => !filteredPlayerIds.includes(id));
//       } else {
//         return [...new Set([...prev, ...filteredPlayerIds])];
//       }
//     });

//     setAllPlayers((prev) =>
//       prev.map((p) => ({
//         ...p,
//         selected: filteredPlayers.some((fp) => fp.id === p.id)
//           ? !filteredPlayers.every((fp) => selectedPlayers.includes(fp.id!))
//           : p.selected,
//       }))
//     );
//   };

//   const selectFavoritesOnly = () => {
//     const favoriteIds = allPlayers.filter((p) => p.isFavorite).map((p) => p.id!);
//     setSelectedPlayers(favoriteIds);
//     setAllPlayers((prev) =>
//       prev.map((p) => ({
//         ...p,
//         selected: p.isFavorite,
//       }))
//     );
//   };

//   const filteredPlayers = allPlayers.filter(
//     (player) =>
//       player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       player.phone?.includes(searchQuery)
//   );

//   const sportColor = getSportColor(selectedSport);

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#16a34a" />
//         <Text style={styles.loadingText}>Yükleniyor...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={[styles.header, { backgroundColor: sportColor }]}>
//         <TouchableOpacity onPress={() => goBack()} style={styles.headerButton}>
//           <ChevronLeft size={24} color="white" strokeWidth={2} />
//         </TouchableOpacity>

//         <View style={styles.headerCenter}>
//           <Text style={styles.headerTitle}>Yeni Arkadaşlık Maçı</Text>
//           <Text style={styles.headerSubtitle}>
//             {getSportIcon(selectedSport)} {SPORT_CONFIGS[selectedSport].name}
//           </Text>
//         </View>

//         <TouchableOpacity
//           onPress={handleCreate}
//           style={styles.headerButton}
//           disabled={creating}
//         >
//           {creating ? (
//             <ActivityIndicator size="small" color="white" />
//           ) : (
//             <Send size={24} color="white" strokeWidth={2} />
//           )}
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Template Selection */}
//         {templates.length > 0 && (
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>
//                 {selectedTemplate ? '✨ Şablon: ' + selectedTemplate.name : 'Şablon Seç'}
//               </Text>
//               {selectedTemplate && (
//                 <TouchableOpacity onPress={resetToDefaults}>
//                   <Text style={[styles.linkText, { color: '#EF4444' }]}>
//                     Sıfırla
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             <TouchableOpacity
//               style={[styles.templateButton, selectedTemplate && styles.templateButtonActive]}
//               onPress={() => setShowTemplateModal(true)}
//             >
//               <Sparkles 
//                 size={20} 
//                 color={selectedTemplate ? sportColor : '#9CA3AF'} 
//                 strokeWidth={2} 
//               />
//               <Text style={[
//                 styles.templateButtonText,
//                 selectedTemplate && { color: sportColor }
//               ]}>
//                 {selectedTemplate 
//                   ? `${selectedTemplate.name} yüklendi`
//                   : 'Kayıtlı şablonlardan seç'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Date & Time */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Tarih & Saat</Text>
          
//           <View style={styles.row}>
//             <TouchableOpacity
//               style={[styles.dateTimeButton, styles.halfInput]}
//               onPress={() => setShowDatePicker(true)}
//             >
//               <Calendar size={20} color={sportColor} strokeWidth={2} />
//               <Text style={styles.dateTimeText}>
//                 {matchDate.toLocaleDateString('tr-TR', {
//                   day: '2-digit',
//                   month: 'long',
//                   year: 'numeric',
//                 })}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.dateTimeButton, styles.halfInput]}
//               onPress={() => setShowTimePicker(true)}
//             >
//               <Clock size={20} color={sportColor} strokeWidth={2} />
//               <Text style={styles.dateTimeText}>
//                 {matchTime.toLocaleTimeString('tr-TR', {
//                   hour: '2-digit',
//                   minute: '2-digit',
//                 })}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {showDatePicker && (
//             <DateTimePicker
//               value={matchDate}
//               mode="date"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               onChange={(event, date) => {
//                 setShowDatePicker(Platform.OS === 'ios');
//                 if (date) setMatchDate(date);
//               }}
//             />
//           )}

//           {showTimePicker && (
//             <DateTimePicker
//               value={matchTime}
//               mode="time"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               onChange={(event, date) => {
//                 setShowTimePicker(Platform.OS === 'ios');
//                 if (date) setMatchTime(date);
//               }}
//             />
//           )}
//         </View>

//         {/* Sport Selection */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Spor Türü</Text>
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.sportScrollContent}
//           >
//             {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport) => (
//               <TouchableOpacity
//                 key={sport}
//                 style={[
//                   styles.sportCard,
//                   selectedSport === sport && styles.sportCardActive,
//                   {
//                     borderColor:
//                       selectedSport === sport
//                         ? SPORT_CONFIGS[sport].color
//                         : '#E5E7EB',
//                   },
//                 ]}
//                 onPress={() => setSelectedSport(sport)}
//               >
//                 <Text style={styles.sportEmoji}>{SPORT_CONFIGS[sport].emoji}</Text>
//                 <Text
//                   style={[
//                     styles.sportName,
//                     selectedSport === sport && {
//                       color: SPORT_CONFIGS[sport].color,
//                     },
//                   ]}
//                 >
//                   {SPORT_CONFIGS[sport].name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         {/* Match Details */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Maç Detayları</Text>

//           <View style={styles.inputContainer}>
//             <MapPin size={20} color="#6B7280" strokeWidth={2} />
//             <TextInput
//               style={styles.inputText}
//               placeholder="Saha Adı *"
//               value={venue}
//               onChangeText={setVenue}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <DollarSign size={20} color="#6B7280" strokeWidth={2} />
//             <TextInput
//               style={styles.inputText}
//               placeholder="Kişi Başı Maliyet (₺)"
//               value={costPerPlayer}
//               onChangeText={setCostPerPlayer}
//               keyboardType="decimal-pad"
//             />
//           </View>

//           <View style={styles.row}>
//             <View style={[styles.inputContainer, styles.halfInput]}>
//               <Users size={18} color="#6B7280" strokeWidth={2} />
//               <TextInput
//                 style={styles.inputText}
//                 placeholder="Kadro"
//                 value={staffCount}
//                 onChangeText={setStaffCount}
//                 keyboardType="number-pad"
//               />
//             </View>

//             <View style={[styles.inputContainer, styles.halfInput]}>
//               <Users size={18} color="#6B7280" strokeWidth={2} />
//               <TextInput
//                 style={styles.inputText}
//                 placeholder="Yedek"
//                 value={reserveCount}
//                 onChangeText={setReserveCount}
//                 keyboardType="number-pad"
//               />
//             </View>
//           </View>

//           <View style={styles.inputContainer}>
//             <FileText size={20} color="#6B7280" strokeWidth={2} />
//             <TextInput
//               style={styles.inputText}
//               placeholder="Açıklama (opsiyonel)"
//               value={description}
//               onChangeText={setDescription}
//               multiline
//               numberOfLines={2}
//             />
//           </View>
//         </View>

//         {/* Payment Info */}
//         {(peterIban || peterFullName) && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
            
//             <View style={styles.infoBox}>
//               <Info size={16} color="#3B82F6" strokeWidth={2} />
//               <View style={styles.infoContent}>
//                 {peterFullName && (
//                   <Text style={styles.infoText}>
//                     <Text style={styles.infoLabel}>Hesap Sahibi: </Text>
//                     {peterFullName}
//                   </Text>
//                 )}
//                 {peterIban && (
//                   <Text style={styles.infoText}>
//                     <Text style={styles.infoLabel}>IBAN: </Text>
//                     {peterIban}
//                   </Text>
//                 )}
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Settings */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Ayarlar</Text>

//           <View style={styles.settingRow}>
//             <View style={styles.settingInfo}>
//               <Text style={styles.settingLabel}>Herkese Açık</Text>
//               <Text style={styles.settingDescription}>
//                 Herkes görebilir ve katılabilir
//               </Text>
//             </View>
//             <Switch
//               value={isPublic}
//               onValueChange={setIsPublic}
//               trackColor={{ false: '#E5E7EB', true: sportColor }}
//               thumbColor="white"
//             />
//           </View>

//           <View style={styles.settingRow}>
//             <View style={styles.settingInfo}>
//               <Text style={styles.settingLabel}>Otomatik Kabul</Text>
//               <Text style={styles.settingDescription}>
//                 Davetler otomatik kabul edilsin mi?
//               </Text>
//             </View>
//             <Switch
//               value={autoAccept}
//               onValueChange={setAutoAccept}
//               trackColor={{ false: '#E5E7EB', true: sportColor }}
//               thumbColor="white"
//             />
//           </View>

//           <View style={styles.settingRow}>
//             <View style={styles.settingInfo}>
//               <Text style={styles.settingLabel}>İstatistikleri Etkile</Text>
//               <Text style={styles.settingDescription}>
//                 Oyuncu istatistiklerine yansısın mı?
//               </Text>
//             </View>
//             <Switch
//               value={affectsStats}
//               onValueChange={setAffectsStats}
//               trackColor={{ false: '#E5E7EB', true: sportColor }}
//               thumbColor="white"
//             />
//           </View>

//           <View style={styles.settingRow}>
//             <View style={styles.settingInfo}>
//               <Text style={styles.settingLabel}>Puan Durumunu Etkile</Text>
//               <Text style={styles.settingDescription}>
//                 Lig puan durumuna yansısın mı?
//               </Text>
//             </View>
//             <Switch
//               value={affectsStandings}
//               onValueChange={setAffectsStandings}
//               trackColor={{ false: '#E5E7EB', true: sportColor }}
//               thumbColor="white"
//             />
//           </View>
//         </View>

//         {/* Player Selection */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>
//               Davet Edilecek Oyuncular ({selectedPlayers.length})
//             </Text>
//             <TouchableOpacity onPress={selectFavoritesOnly}>
//               <Text style={[styles.linkText, { color: sportColor }]}>
//                 Favorileri Seç
//               </Text>
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity
//             style={styles.playerSelectionButton}
//             onPress={() => setShowPlayerModal(true)}
//           >
//             <Users size={20} color={sportColor} strokeWidth={2} />
//             <Text style={styles.playerSelectionText}>
//               {selectedPlayers.length > 0
//                 ? `${selectedPlayers.length} oyuncu seçildi`
//                 : 'Oyuncu seç *'}
//             </Text>
//             <Check size={20} color="#9CA3AF" strokeWidth={2} />
//           </TouchableOpacity>

//           {selectedPlayers.length > 0 && (
//             <View style={styles.selectedPlayersPreview}>
//               {allPlayers
//                 .filter((p) => selectedPlayers.includes(p.id!))
//                 .slice(0, 5)
//                 .map((player) => (
//                   <View key={player.id} style={styles.playerChip}>
//                     <Text style={styles.playerChipText}>{player.name}</Text>
//                     {player.isFavorite && (
//                       <Star size={12} color="#F59E0B" fill="#F59E0B" />
//                     )}
//                   </View>
//                 ))}
//               {selectedPlayers.length > 5 && (
//                 <View style={styles.playerChip}>
//                   <Text style={styles.playerChipText}>
//                     +{selectedPlayers.length - 5} daha
//                   </Text>
//                 </View>
//               )}
//             </View>
//           )}
//         </View>

//         {/* Save as Template */}
//         <View style={styles.section}>
//           <View style={styles.settingRow}>
//             <View style={styles.settingInfo}>
//               <Text style={styles.settingLabel}>Şablon olarak kaydet</Text>
//               <Text style={styles.settingDescription}>
//                 Bu ayarları tekrar kullan
//               </Text>
//             </View>
//             <Switch
//               value={saveAsTemplate}
//               onValueChange={setSaveAsTemplate}
//               trackColor={{ false: '#E5E7EB', true: sportColor }}
//               thumbColor="white"
//             />
//           </View>

//           {saveAsTemplate && (
//             <View style={styles.templateNameContainer}>
//               <TextInput
//                 style={styles.textInput}
//                 placeholder="Şablon adı girin"
//                 value={templateName}
//                 onChangeText={setTemplateName}
//               />
//             </View>
//           )}
//         </View>

//         {/* Create Button */}
//         <View style={styles.section}>
//           <TouchableOpacity
//             style={[styles.createButton, { backgroundColor: sportColor }]}
//             onPress={handleCreate}
//             disabled={creating}
//           >
//             {creating ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <>
//                 <Send size={20} color="white" strokeWidth={2} />
//                 <Text style={styles.createButtonText}>
//                   Maç Oluştur ve Davet Gönder
//                 </Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>

//         <View style={styles.bottomSpacing} />
//       </ScrollView>

//       {/* Template Selection Modal */}
//       <Modal
//         visible={showTemplateModal}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowTemplateModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Şablon Seç</Text>
//               <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
//                 <Text style={[styles.linkText, { color: sportColor }]}>Kapat</Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView>
//               {templates.map((template) => (
//                 <TouchableOpacity
//                   key={template.id}
//                   style={styles.templateItem}
//                   onPress={() => loadTemplate(template)}
//                 >
//                   <View style={styles.templateItemLeft}>
//                     <Sparkles size={20} color={sportColor} strokeWidth={2} />
//                     <View style={styles.templateItemInfo}>
//                       <Text style={styles.templateItemName}>{template.name}</Text>
//                       <Text style={styles.templateItemDetails}>
//                         {getSportIcon(template.settings?.sportType || 'Futbol')}{' '}
//                         {template.settings?.location || 'Saha belirtilmemiş'}
//                       </Text>
//                     </View>
//                   </View>
//                   <Check size={20} color="#9CA3AF" strokeWidth={2} />
//                 </TouchableOpacity>
//               ))}

//               {templates.length === 0 && (
//                 <View style={styles.emptyState}>
//                   <Sparkles size={48} color="#D1D5DB" strokeWidth={1.5} />
//                   <Text style={styles.emptyStateText}>Henüz şablon yok</Text>
//                 </View>
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* Player Selection Modal */}
//       <Modal
//         visible={showPlayerModal}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowPlayerModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 Oyuncu Seç ({selectedPlayers.length})
//               </Text>
//               <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
//                 <Check size={24} color={sportColor} strokeWidth={2} />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.searchContainer}>
//               <Search size={20} color="#9CA3AF" strokeWidth={2} />
//               <TextInput
//                 style={styles.searchInput}
//                 placeholder="Oyuncu ara..."
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//               />
//             </View>

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.actionButton}
//                 onPress={selectAllPlayers}
//               >
//                 <Text style={[styles.actionButtonText, { color: sportColor }]}>
//                   {filteredPlayers.every((p) => selectedPlayers.includes(p.id!))
//                     ? 'Tümünü Kaldır'
//                     : 'Tümünü Seç'}
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.actionButton}
//                 onPress={selectFavoritesOnly}
//               >
//                 <Star size={16} color="#F59E0B" fill="#F59E0B" />
//                 <Text style={[styles.actionButtonText, { color: sportColor }]}>
//                   Favoriler
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView>
//               {filteredPlayers.map((player) => (
//                 <TouchableOpacity
//                   key={player.id}
//                   style={styles.playerItem}
//                   onPress={() => togglePlayerSelection(player.id!)}
//                 >
//                   <View style={styles.playerItemInfo}>
//                     <Text style={styles.playerItemName}>{player.name}</Text>
//                     <Text style={styles.playerItemPhone}>{player.phone}</Text>
//                   </View>
//                   <View style={styles.playerItemRight}>
//                     {player.isFavorite && (
//                       <Star
//                         size={16}
//                         color="#F59E0B"
//                         fill="#F59E0B"
//                         style={styles.favoriteIcon}
//                       />
//                     )}
//                     <View
//                       style={[
//                         styles.checkbox,
//                         selectedPlayers.includes(player.id!) && {
//                           ...styles.checkboxChecked,
//                           backgroundColor: sportColor,
//                           borderColor: sportColor,
//                         },
//                       ]}
//                     >
//                       {selectedPlayers.includes(player.id!) && (
//                         <Check size={16} color="white" strokeWidth={2.5} />
//                       )}
//                     </View>
//                   </View>
//                 </TouchableOpacity>
//               ))}

//               {filteredPlayers.length === 0 && (
//                 <View style={styles.emptyState}>
//                   <Search size={48} color="#D1D5DB" strokeWidth={1.5} />
//                   <Text style={styles.emptyStateText}>Oyuncu bulunamadı</Text>
//                 </View>
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F9FAFB',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 50,
//     paddingBottom: 16,
//   },
//   headerButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: 'white',
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.9)',
//     marginTop: 2,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   section: {
//     backgroundColor: 'white',
//     marginTop: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 12,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   linkText: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   templateButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     padding: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   templateButtonActive: {
//     backgroundColor: '#EFF6FF',
//     borderColor: '#3B82F6',
//   },
//   templateButtonText: {
//     flex: 1,
//     fontSize: 15,
//     color: '#6B7280',
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   halfInput: {
//     flex: 1,
//   },
//   dateTimeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     padding: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   dateTimeText: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1F2937',
//     fontWeight: '500',
//   },
//   sportScrollContent: {
//     paddingRight: 16,
//   },
//   sportCard: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#F9FAFB',
//     borderRadius: 12,
//     borderWidth: 2,
//     marginRight: 12,
//     minWidth: 100,
//   },
//   sportCardActive: {
//     backgroundColor: 'white',
//   },
//   sportEmoji: {
//     fontSize: 24,
//     marginBottom: 4,
//   },
//   sportName: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     padding: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     marginBottom: 12,
//   },
//   inputText: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1F2937',
//   },
//   textInput: {
//     padding: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     fontSize: 15,
//     color: '#1F2937',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   infoBox: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 10,
//     padding: 12,
//     backgroundColor: '#EFF6FF',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#DBEAFE',
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoText: {
//     fontSize: 13,
//     color: '#1F2937',
//     lineHeight: 18,
//     marginBottom: 4,
//   },
//   infoLabel: {
//     fontWeight: '600',
//   },
//   settingRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   settingInfo: {
//     flex: 1,
//     marginRight: 12,
//   },
//   settingLabel: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   settingDescription: {
//     fontSize: 13,
//     color: '#6B7280',
//   },
//   playerSelectionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     padding: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   playerSelectionText: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1F2937',
//   },
//   selectedPlayersPreview: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 12,
//   },
//   playerChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: '#EFF6FF',
//     borderRadius: 16,
//   },
//   playerChipText: {
//     fontSize: 13,
//     color: '#3B82F6',
//     fontWeight: '500',
//   },
//   templateNameContainer: {
//     marginTop: 12,
//   },
//   createButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     padding: 16,
//     borderRadius: 12,
//   },
//   createButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: 'white',
//   },
//   bottomSpacing: {
//     height: 32,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: '80%',
//     paddingBottom: 32,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1F2937',
//   },
//   templateItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   templateItemLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     flex: 1,
//   },
//   templateItemInfo: {
//     flex: 1,
//   },
//   templateItemName: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#1F2937',
//     marginBottom: 2,
//   },
//   templateItemDetails: {
//     fontSize: 13,
//     color: '#6B7280',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: '#F3F4F6',
//     marginHorizontal: 16,
//     marginVertical: 12,
//     borderRadius: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1F2937',
//     paddingVertical: 8,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 16,
//   },
//   actionButtonText: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   playerItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   playerItemInfo: {
//     flex: 1,
//   },
//   playerItemName: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#1F2937',
//     marginBottom: 2,
//   },
//   playerItemPhone: {
//     fontSize: 13,
//     color: '#6B7280',
//   },
//   playerItemRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   favoriteIcon: {
//     marginRight: 4,
//   },
//   checkbox: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: '#D1D5DB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   checkboxChecked: {
//     borderColor: '#16a34a',
//     backgroundColor: '#16a34a',
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 48,
//   },
//   emptyStateText: {
//     marginTop: 12,
//     fontSize: 15,
//     color: '#9CA3AF',
//   },
// });