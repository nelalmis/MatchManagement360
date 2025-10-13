// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Platform,
// } from 'react-native';
// import {
//   Save,
//   X,
// } from 'lucide-react-native';

// export const ModalHeader : React.FC = () => {
//     const [showSaveButton, setShowSaveButton] =useState(false);
//     const handleCancel = () =>{
        
//     }
//     const handleSave = () =>{
        
//     }
//     return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={handleCancel}
//           activeOpacity={0.7}
//         >
//           <X size={24} color="#1F2937" strokeWidth={2} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Profili Düzenle</Text>
//         <TouchableOpacity
//           style={[styles.headerButton, saving && styles.headerButtonDisabled]}
//           onPress={handleSave}
//           disabled={saving}
//           activeOpacity={0.7}
//         >
//           {saving ? (
//             <ActivityIndicator size="small" color="#16a34a" />
//           ) : (
//             <Save size={24} color="#16a34a" strokeWidth={2} />
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles =  StyleSheet.create({
//     header: {
//         paddingTop: Platform.OS === 'ios' ? 50 : 40,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: 'white',
//         borderBottomWidth: 1,
//         borderBottomColor: '#E5E7EB',
//       },
//       headerButton: {
//         width: 40,
//         height: 40,
//         justifyContent: 'center',
//         alignItems: 'center',
//       },
//       headerButtonDisabled: {
//         opacity: 0.5,
//       },
//       headerTitle: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: '#1F2937',
//       },     
// });