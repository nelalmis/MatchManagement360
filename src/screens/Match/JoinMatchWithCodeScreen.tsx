// // src/screens/Match/JoinMatchWithCodeScreen.tsx
// // 🎯 JOIN MATCH WITH INVITATION CODE - FIXED REF TYPES

// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   Alert,
//   Keyboard,
// } from 'react-native';
// import {
//   ArrowLeft,
//   Check,
//   AlertCircle,
//   Info,
//   Trophy,
// } from 'lucide-react-native';
// import { NavigationService } from '../../navigation/NavigationService';
// import { MatchService } from '../../services/serviceLayer/matchService';
// import { useAuth } from '../../hooks';
// import { SPORT_CONFIGS } from '../../types/entity/types';

// export const JoinMatchWithCodeScreen: React.FC = () => {
//   const { user } = useAuth();
  
//   const [code, setCode] = useState(['', '', '', '', '', '']);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
  
//   // ✅ FIXED: Refs for text inputs - Correct TypeScript type
//   const inputRefs = useRef<(TextInput | null)[]>([]);

//   const handleCodeChange = (value: string, index: number) => {
//     // Only allow alphanumeric
//     const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
//     if (cleaned.length > 1) return; // Prevent paste

//     const newCode = [...code];
//     newCode[index] = cleaned;
//     setCode(newCode);
//     setError(null);

//     // Auto-focus next input
//     if (cleaned && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }

//     // Auto-submit when all filled
//     if (cleaned && index === 5) {
//       const fullCode = [...newCode.slice(0, 5), cleaned].join('');
//       if (fullCode.length === 6) {
//         Keyboard.dismiss();
//         handleJoin(fullCode);
//       }
//     }
//   };

//   const handleKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleJoin = async (codeString?: string) => {
//     const fullCode = codeString || code.join('');

//     if (fullCode.length !== 6) {
//       setError('Lütfen 6 haneli kodu girin');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const result = await MatchService.joinWithInvitationCode(
//         fullCode,
//         user!.id!
//       );

//       if (!result.success) {
//         switch (result.error?.code) {
//           case 'INVALID_CODE':
//             setError('Geçersiz davet kodu. Lütfen kontrol edin.');
//             break;
//           case 'CODE_EXPIRED':
//             setError('Bu davet kodunun süresi dolmuş.');
//             break;
//           case 'CODE_LIMIT_REACHED':
//             setError('Bu kod maksimum kullanım sayısına ulaşmış.');
//             break;
//           case 'ALREADY_REGISTERED':
//             setError('Bu maça zaten kayıtlısınız.');
//             setTimeout(() => {
//               if (result.data?.id) {
//                 NavigationService.navigateToMatch(result.data.id);
//               }
//             }, 1500);
//             break;
//           case 'MATCH_FULL':
//             setError('Maç kadrosu dolu. Kayıt kapalı.');
//             break;
//           default:
//             setError(result.error?.message || 'Bir hata oluştu');
//         }
//         return;
//       }

//       const match = result.data!;
//       const sportConfig = SPORT_CONFIGS[match.sportType || 'Futbol'];

//       Alert.alert(
//         'Başarılı! 🎉',
//         `${sportConfig.emoji} ${match.title} maçına kaydoldunuz.`,
//         [
//           {
//             text: 'Maça Git',
//             onPress: () => {
//               NavigationService.navigateToMatch(match.id!);
//             }
//           }
//         ]
//       );

//     } catch (error) {
//       console.error('Join error:', error);
//       setError('Beklenmeyen bir hata oluştu');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const clearCode = () => {
//     setCode(['', '', '', '', '', '']);
//     setError(null);
//     inputRefs.current[0]?.focus();
//   };

//   const isCodeComplete = code.every(digit => digit.length === 1);

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           onPress={() => NavigationService.goBack()} 
//           style={styles.backButton}
//         >
//           <ArrowLeft size={24} color="#1F2937" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Maça Katıl</Text>
//         <View style={styles.headerRight} />
//       </View>

//       <View style={styles.content}>
//         {/* Icon */}
//         <View style={styles.iconContainer}>
//           <View style={styles.iconCircle}>
//             <Trophy size={48} color="#10B981" strokeWidth={2} />
//           </View>
//         </View>

//         {/* Title */}
//         <Text style={styles.title}>Davet Kodu Girin</Text>
//         <Text style={styles.subtitle}>
//           Organizatörden aldığınız 6 haneli kodu girin
//         </Text>

//         {/* Code Input */}
//         <View style={styles.codeContainer}>
//           {code.map((digit, index) => (
//             <TextInput
//               key={index}
//               ref={(ref) => {
//                 inputRefs.current[index] = ref;
//               }}
//               style={[
//                 styles.codeInput,
//                 digit && styles.codeInputFilled,
//                 error && styles.codeInputError,
//               ]}
//               value={digit}
//               onChangeText={(value) => handleCodeChange(value, index)}
//               onKeyPress={(e) => handleKeyPress(e, index)}
//               maxLength={1}
//               keyboardType="ascii-capable"
//               autoCapitalize="characters"
//               autoCorrect={false}
//               selectTextOnFocus
//               editable={!loading}
//             />
//           ))}
//         </View>

//         {/* Error Message */}
//         {error && (
//           <View style={styles.errorContainer}>
//             <AlertCircle size={16} color="#DC2626" strokeWidth={2} />
//             <Text style={styles.errorText}>{error}</Text>
//           </View>
//         )}

//         {/* Actions */}
//         <View style={styles.actions}>
//           <TouchableOpacity
//             style={styles.clearButton}
//             onPress={clearCode}
//             disabled={loading || !code.some(d => d)}
//           >
//             <Text style={styles.clearButtonText}>Temizle</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.joinButton,
//               (!isCodeComplete || loading) && styles.joinButtonDisabled,
//             ]}
//             onPress={() => handleJoin()}
//             disabled={!isCodeComplete || loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#FFF" />
//             ) : (
//               <>
//                 <Check size={20} color="#FFF" strokeWidth={2.5} />
//                 <Text style={styles.joinButtonText}>Katıl</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Info Box */}
//         <View style={styles.infoBox}>
//           <Info size={20} color="#3B82F6" strokeWidth={2} />
//           <View style={styles.infoContent}>
//             <Text style={styles.infoTitle}>Davet Kodu Nasıl Alınır?</Text>
//             <Text style={styles.infoText}>
//               • Maç organizatöründen WhatsApp veya SMS ile kod alın{'\n'}
//               • Kod genellikle 48 saat süreyle geçerlidir{'\n'}
//               • Kodu girince otomatik olarak maça kaydolursunuz
//             </Text>
//           </View>
//         </View>

//         {/* Example Codes (for demo) */}
//         {__DEV__ && (
//           <View style={styles.devBox}>
//             <Text style={styles.devTitle}>🔧 Demo Kodlar (Dev Mode):</Text>
//             <TouchableOpacity onPress={() => setCode(['T', 'E', 'S', 'T', '1', '2'])}>
//               <Text style={styles.devCode}>TEST12</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#FFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//   },
//   headerRight: {
//     width: 40,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingTop: 40,
//   },
//   iconContainer: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   iconCircle: {
//     width: 96,
//     height: 96,
//     borderRadius: 48,
//     backgroundColor: '#DCFCE7',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#1F2937',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 15,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   codeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 12,
//     marginBottom: 24,
//   },
//   codeInput: {
//     width: 48,
//     height: 56,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderRadius: 12,
//     backgroundColor: '#FFF',
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1F2937',
//     textAlign: 'center',
//   },
//   codeInputFilled: {
//     borderColor: '#10B981',
//     backgroundColor: '#DCFCE7',
//   },
//   codeInputError: {
//     borderColor: '#DC2626',
//     backgroundColor: '#FEE2E2',
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: '#FEE2E2',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginBottom: 24,
//   },
//   errorText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#DC2626',
//     fontWeight: '500',
//   },
//   actions: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 32,
//   },
//   clearButton: {
//     flex: 1,
//     paddingVertical: 16,
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   clearButtonText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#6B7280',
//   },
//   joinButton: {
//     flex: 2,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     paddingVertical: 16,
//     backgroundColor: '#10B981',
//     borderRadius: 12,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   joinButtonDisabled: {
//     backgroundColor: '#D1D5DB',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   joinButtonText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#FFF',
//   },
//   infoBox: {
//     flexDirection: 'row',
//     gap: 12,
//     backgroundColor: '#EFF6FF',
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#3B82F6',
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#1E40AF',
//     marginBottom: 6,
//   },
//   infoText: {
//     fontSize: 13,
//     color: '#1E40AF',
//     lineHeight: 20,
//   },
//   devBox: {
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: '#FEF3C7',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#F59E0B',
//   },
//   devTitle: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#92400E',
//     marginBottom: 8,
//   },
//   devCode: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#92400E',
//     fontFamily: 'monospace',
//   },
// });