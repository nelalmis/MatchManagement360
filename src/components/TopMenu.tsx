// // components/TopMenu.tsx
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Menu, LogOut } from 'lucide-react-native';

// interface TopMenuProps {
//   onMenuPress: () => void;
//   onLogout: () => void;
// }

// export const TopMenu: React.FC<TopMenuProps> = ({ onMenuPress, onLogout }) => {
//   return (
//     <View style={styles.topMenu}>
//       <Text style={styles.appTitle}>Maç Yönetimi</Text>
//       <View style={styles.topMenuRight}>
//         <TouchableOpacity onPress={onMenuPress}>
//           <Menu size={24} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={onLogout}>
//           <LogOut size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   topMenu: {
//     height: 60,
//     backgroundColor: '#16a34a',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     marginTop:30
//   },
//   appTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   topMenuRight: {
//     flexDirection: 'row',
//     gap: 12,
//   },
// });