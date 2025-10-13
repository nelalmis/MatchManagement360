// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// import {
//   Home,
//   Trophy,
//   Calendar,
//   BarChart3,
//   User,
// } from 'lucide-react-native';
// import { useNavigationContext } from '../context/NavigationContext';

// interface TabItem {
//   id: string;
//   label: string;
//   icon: React.ComponentType<any>;
//   screen: string;
// }

// const tabs: TabItem[] = [
//   {
//     id: 'home',
//     label: 'Ana Sayfa',
//     icon: Home,
//     screen: 'home',
//   },
//   {
//     id: 'leagues',
//     label: 'Ligler',
//     icon: Trophy,
//     screen: 'leagueList',
//   },
//   {
//     id: 'matches',
//     label: 'Maçlar',
//     icon: Calendar,
//     screen: 'myMatches',
//   },
//   {
//     id: 'stats',
//     label: 'İstatistikler',
//     icon: BarChart3,
//     screen: 'playerStats',
//   },
//   {
//     id: 'profile',
//     label: 'Profil',
//     icon: User,
//     screen: 'playerProfile',
//   },
// ];

// export const BottomNav: React.FC = () => {
//   const { currentPage, navigate } = useNavigationContext();

//   // Determine which tab is active based on current page
//   const getActiveTab = () => {
//     // Map pages to tab ids
//     const pageToTab: Record<string, string> = {
//       'home': 'home',
//       'leagueList': 'leagues',
//       'leagueDetail': 'leagues',
//       'createLeague': 'leagues',
//       'editLeague': 'leagues',
//       'myMatches': 'matches',
//       'matchList': 'matches',
//       'matchDetail': 'matches',
//       'matchRegistration': 'matches',
//       'playerStats': 'stats',
//       'standings': 'stats',
//       'topScorers': 'stats',
//       'topAssists': 'stats',
//       'mvp': 'stats',
//       'playerProfile': 'profile',
//       'editProfile': 'profile',
//     };
    
//     return pageToTab[currentPage] || 'home';
//   };

//   const activeTabId = getActiveTab();

//   return (
//     <View style={styles.container}>
//       <View style={styles.inner}>
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTabId === tab.id;

//           return (
//             <TouchableOpacity
//               key={tab.id}
//               style={styles.tab}
//               onPress={() => navigate(tab.screen)}
//               activeOpacity={0.7}
//             >
//               <View
//                 style={[
//                   styles.iconContainer,
//                   isActive && styles.iconContainerActive,
//                 ]}
//               >
//                 <Icon
//                   size={22}
//                   color={isActive ? '#16a34a' : '#9CA3AF'}
//                   strokeWidth={isActive ? 2.5 : 2}
//                 />
//               </View>
//               <Text
//                 style={[
//                   styles.label,
//                   isActive && styles.labelActive,
//                 ]}
//               >
//                 {tab.label}
//               </Text>
//               {isActive && <View style={styles.activeIndicator} />}
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: 'white',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     paddingBottom: Platform.OS === 'ios' ? 20 : 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   inner: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingTop: 8,
//     paddingHorizontal: 8,
//   },
//   tab: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 8,
//     position: 'relative',
//   },
//   iconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   iconContainerActive: {
//     backgroundColor: '#DCFCE7',
//   },
//   label: {
//     fontSize: 11,
//     color: '#9CA3AF',
//     fontWeight: '500',
//   },
//   labelActive: {
//     color: '#16a34a',
//     fontWeight: '700',
//   },
//   activeIndicator: {
//     position: 'absolute',
//     top: 0,
//     width: 32,
//     height: 3,
//     backgroundColor: '#16a34a',
//     borderRadius: 2,
//   },
// });