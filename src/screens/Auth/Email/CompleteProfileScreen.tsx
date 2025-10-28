// // src/screens/auth/CompleteProfileScreen.tsx
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Screen, Container, Input, Button, Spacer } from '../../../components';
// import { useAuth } from '../../../hooks';
// import { colors, typography, spacing } from '../../../config/theme';
// import { SportType,SPORT_CONFIGS } from '../../../types/entity/types';

// export function CompleteProfileScreen() {
//   const navigation = useNavigation();
//   const { user, updateProfile, addSport, setSportPositions, loading } = useAuth();

//   const [step, setStep] = useState(1);
//   const [profileData, setProfileData] = useState({
//     jerseyNumber: '',
//     birthDate: '',
//     phone: user?.phone || '',
//   });
//   const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
//   const [sportPositions, setSportPositionsData] = useState<Partial<Record<SportType, string[]>>>({});

//   const handleSportToggle = (sport: SportType) => {
//     if (selectedSports.includes(sport)) {
//       setSelectedSports(selectedSports.filter((s) => s !== sport));
//       const newPositions = { ...sportPositions };
//       delete newPositions[sport];
//       setSportPositionsData(newPositions);
//     } else {
//       setSelectedSports([...selectedSports, sport]);
//     }
//   };

//   const handlePositionToggle = (sport: SportType, position: string) => {
//     const currentPositions = sportPositions[sport] || [];
    
//     if (currentPositions.includes(position)) {
//       setSportPositionsData({
//         ...sportPositions,
//         [sport]: currentPositions.filter((p) => p !== position),
//       });
//     } else {
//       setSportPositionsData({
//         ...sportPositions,
//         [sport]: [...currentPositions, position],
//       });
//     }
//   };

//   const handleNext = () => {
//     if (step === 1) {
//       setStep(2);
//     } else if (step === 2) {
//       if (selectedSports.length === 0) {
//         Alert.alert('Uyarı', 'Lütfen en az bir spor seçin');
//         return;
//       }
      
//       // Pozisyon olmayan sporlar için direkt tamamla
//       const sportsWithPositions = selectedSports.filter(
//         sport => SPORT_CONFIGS[sport].positions.length > 0
//       );
      
//       if (sportsWithPositions.length === 0) {
//         handleComplete();
//       } else {
//         setStep(3);
//       }
//     }
//   };

//   const handleBack = () => {
//     if (step > 1) {
//       setStep(step - 1);
//     }
//   };

//   const handleComplete = async () => {
//     try {
//       // Update profile data
//       const profileResult = await updateProfile({
//         jerseyNumber: profileData.jerseyNumber || undefined,
//         birthDate: profileData.birthDate || undefined,
//         phone: profileData.phone || undefined,
//       });

//       if (!profileResult.success) {
//         Alert.alert('Hata', profileResult.error || 'Profil güncellenemedi');
//         return;
//       }

//       // Add favorite sports
//       for (const sport of selectedSports) {
//         await addSport(sport);

//         // Set positions for this sport (if any)
//         const positions = sportPositions[sport] || [];
//         if (positions.length > 0) {
//           await setSportPositions(sport, positions);
//         }
//       }

//       Alert.alert(
//         'Tebrikler! 🎉',
//         'Profiliniz tamamlandı. Artık tüm özellikleri kullanabilirsiniz!',
//         [
//           {
//             text: 'Başla',
//             onPress: () => {
//               // Navigation will be handled by useAuthListener
//               // User is now authenticated and profile is complete
//             },
//           },
//         ]
//       );
//     } catch (error: any) {
//       Alert.alert('Hata', error.message || 'Bir hata oluştu');
//     }
//   };

//   const handleSkip = () => {
//     Alert.alert(
//       'Profili Atla',
//       'Profil bilgilerinizi daha sonra tamamlayabilirsiniz. Devam etmek istiyor musunuz?',
//       [
//         { text: 'İptal', style: 'cancel' },
//         {
//           text: 'Atla',
//           onPress: () => {
//             // User will be directed to main app with incomplete profile
//           },
//         },
//       ]
//     );
//   };

//   const renderStep1 = () => (
//     <>
//       <View style={styles.header}>
//         <Text style={styles.stepIndicator}>Adım 1/3</Text>
//         <Text style={styles.title}>Profil Bilgileri</Text>
//         <Text style={styles.subtitle}>
//           Profil bilgilerinizi tamamlayın (opsiyonel)
//         </Text>
//       </View>

//       <Spacer size="xl" />

//       <Input
//         label="Forma Numarası"
//         placeholder="Örn: 10"
//         value={profileData.jerseyNumber}
//         onChangeText={(text) =>
//           setProfileData({ ...profileData, jerseyNumber: text })
//         }
//         keyboardType="numeric"
//         maxLength={3}
//         leftIcon={<Text>🔢</Text>}
//       />

//       <Input
//         label="Doğum Tarihi"
//         placeholder="GG/AA/YYYY"
//         value={profileData.birthDate}
//         onChangeText={(text) =>
//           setProfileData({ ...profileData, birthDate: text })
//         }
//         leftIcon={<Text>📅</Text>}
//       />

//       <Input
//         label="Telefon"
//         placeholder="+90 5XX XXX XX XX"
//         value={profileData.phone}
//         onChangeText={(text) =>
//           setProfileData({ ...profileData, phone: text })
//         }
//         keyboardType="phone-pad"
//         leftIcon={<Text>📱</Text>}
//       />

//       <Spacer size="xl" />

//       <Button
//         title="Devam Et"
//         onPress={handleNext}
//         disabled={loading}
//         fullWidth
//         size="large"
//       />
//     </>
//   );

//   const renderStep2 = () => {
//     const availableSports = Object.keys(SPORT_CONFIGS) as SportType[];

//     return (
//       <>
//         <View style={styles.header}>
//           <Text style={styles.stepIndicator}>Adım 2/3</Text>
//           <Text style={styles.title}>Favori Sporlarınız</Text>
//           <Text style={styles.subtitle}>
//             İlgilendiğiniz sporları seçin
//           </Text>
//         </View>

//         <Spacer size="xl" />

//         <View style={styles.sportsGrid}>
//           {availableSports.map((sport) => {
//             const config = SPORT_CONFIGS[sport];
//             const isSelected = selectedSports.includes(sport);

//             return (
//               <TouchableOpacity
//                 key={sport}
//                 style={[
//                   styles.sportCard,
//                   isSelected && { 
//                     borderColor: config.color,
//                     backgroundColor: `${config.color}15`,
//                   },
//                 ]}
//                 onPress={() => handleSportToggle(sport)}
//                 disabled={loading}
//               >
//                 <Text style={styles.sportEmoji}>{config.emoji}</Text>
//                 <Text
//                   style={[
//                     styles.sportName,
//                     isSelected && { color: config.color },
//                   ]}
//                 >
//                   {config.name}
//                 </Text>
//                 {isSelected && (
//                   <View style={[styles.checkmark, { backgroundColor: config.color }]}>
//                     <Text style={styles.checkmarkText}>✓</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         <Spacer size="xl" />

//         <View style={styles.buttonRow}>
//           <Button
//             title="Geri"
//             onPress={handleBack}
//             variant="outline"
//             style={styles.halfButton}
//           />
//           <Spacer size="md" />
//           <Button
//             title="Devam Et"
//             onPress={handleNext}
//             disabled={loading || selectedSports.length === 0}
//             style={styles.halfButton}
//           />
//         </View>
//       </>
//     );
//   };

//   const renderStep3 = () => {
//     // Sadece pozisyonu olan sporları göster
//     const sportsWithPositions = selectedSports.filter(
//       sport => SPORT_CONFIGS[sport].positions.length > 0
//     );

//     return (
//       <>
//         <View style={styles.header}>
//           <Text style={styles.stepIndicator}>Adım 3/3</Text>
//           <Text style={styles.title}>Pozisyonlarınız</Text>
//           <Text style={styles.subtitle}>
//             Oynadığınız pozisyonları seçin (opsiyonel)
//           </Text>
//         </View>

//         <Spacer size="xl" />

//         <ScrollView style={styles.positionsScroll}>
//           {sportsWithPositions.map((sport) => {
//             const config = SPORT_CONFIGS[sport];

//             return (
//               <View key={sport} style={styles.positionSection}>
//                 <View style={styles.positionSportHeader}>
//                   <Text style={styles.positionSportEmoji}>{config.emoji}</Text>
//                   <Text style={[
//                     styles.positionSportTitle,
//                     { color: config.color }
//                   ]}>
//                     {config.name}
//                   </Text>
//                 </View>
                
//                 <View style={styles.positionsGrid}>
//                   {config.positions.map((position:any) => {
//                     const isSelected = sportPositions[sport]?.includes(position);

//                     return (
//                       <TouchableOpacity
//                         key={position}
//                         style={[
//                           styles.positionChip,
//                           isSelected && {
//                             backgroundColor: config.color,
//                             borderColor: config.color,
//                           },
//                         ]}
//                         onPress={() => handlePositionToggle(sport, position)}
//                         disabled={loading}
//                       >
//                         <Text
//                           style={[
//                             styles.positionText,
//                             isSelected && styles.positionTextSelected,
//                           ]}
//                         >
//                           {position}
//                         </Text>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>
//                 <Spacer size="lg" />
//               </View>
//             );
//           })}
//         </ScrollView>

//         <Spacer size="md" />

//         <View style={styles.buttonRow}>
//           <Button
//             title="Geri"
//             onPress={handleBack}
//             variant="outline"
//             style={styles.halfButton}
//           />
//           <Spacer size="md" />
//           <Button
//             title="Tamamla"
//             onPress={handleComplete}
//             loading={loading}
//             disabled={loading}
//             style={styles.halfButton}
//           />
//         </View>
//       </>
//     );
//   };

//   return (
//     <Screen scroll backgroundColor={colors.background.default}>
//       <Container padding="large" style={styles.container}>
//         {/* Progress Bar */}
//         <View style={styles.progressBar}>
//           <View
//             style={[
//               styles.progressFill,
//               { width: `${(step / 3) * 100}%` },
//             ]}
//           />
//         </View>

//         <Spacer size="xl" />

//         {/* Render Current Step */}
//         {step === 1 && renderStep1()}
//         {step === 2 && renderStep2()}
//         {step === 3 && renderStep3()}

//         {/* Skip Option */}
//         {step === 1 && (
//           <>
//             <Spacer size="lg" />
//             <TouchableOpacity
//               onPress={handleSkip}
//               style={styles.skipButton}
//               disabled={loading}
//             >
//               <Text style={styles.skipText}>Şimdilik Atla</Text>
//             </TouchableOpacity>
//           </>
//         )}
//       </Container>
//     </Screen>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   progressBar: {
//     height: 4,
//     backgroundColor: colors.border.light,
//     borderRadius: 2,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: colors.primary.main,
//   },
//   header: {
//     alignItems: 'center',
//   },
//   stepIndicator: {
//     fontSize: typography.fontSize.sm,
//     fontFamily: typography.fontFamily.bold,
//     color: colors.primary.main,
//     marginBottom: spacing.sm,
//   },
//   title: {
//     fontSize: typography.fontSize['2xl'],
//     fontFamily: typography.fontFamily.bold,
//     color: colors.text.primary,
//     textAlign: 'center',
//     marginBottom: spacing.sm,
//   },
//   subtitle: {
//     fontSize: typography.fontSize.base,
//     fontFamily: typography.fontFamily.regular,
//     color: colors.text.secondary,
//     textAlign: 'center',
//   },
//   sportsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: spacing.md,
//   },
//   sportCard: {
//     width: '47%',
//     aspectRatio: 1.5,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: colors.border.light,
//     padding: spacing.md,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   sportEmoji: {
//     fontSize: 32,
//     marginBottom: spacing.sm,
//   },
//   sportName: {
//     fontSize: typography.fontSize.base,
//     fontFamily: typography.fontFamily.bold,
//     color: colors.text.primary,
//     textAlign: 'center',
//   },
//   checkmark: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   checkmarkText: {
//     color: '#fff',
//     fontSize: 14,
//     fontFamily: typography.fontFamily.bold,
//   },
//   positionsScroll: {
//     maxHeight: 400,
//   },
//   positionSection: {
//     marginBottom: spacing.lg,
//   },
//   positionSportHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: spacing.md,
//   },
//   positionSportEmoji: {
//     fontSize: 24,
//     marginRight: spacing.sm,
//   },
//   positionSportTitle: {
//     fontSize: typography.fontSize.lg,
//     fontFamily: typography.fontFamily.bold,
//   },
//   positionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: spacing.sm,
//   },
//   positionChip: {
//     paddingHorizontal: spacing.md,
//     paddingVertical: spacing.sm,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: colors.border.light,
//   },
//   positionText: {
//     fontSize: typography.fontSize.sm,
//     fontFamily: typography.fontFamily.medium,
//     color: colors.text.primary,
//   },
//   positionTextSelected: {
//     color: '#fff',
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     width: '100%',
//   },
//   halfButton: {
//     flex: 1,
//   },
//   skipButton: {
//     alignItems: 'center',
//     padding: spacing.md,
//   },
//   skipText: {
//     fontSize: typography.fontSize.base,
//     fontFamily: typography.fontFamily.medium,
//     color: colors.text.secondary,
//   },
// });