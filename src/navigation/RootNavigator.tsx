// // navigation/RootNavigator.tsx

// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { RootStackParamList } from './types';
// import { navigationRef } from './NavigationService';
// import { linking } from './linking';
// import { useAppContext } from '../context/AppContext';
// import { ActivityIndicator, View } from 'react-native';
// import { SideMenu } from '../components/SideMenu'; // ✅

// // Stacks & Tabs
// import { AuthStack } from './stacks/AuthStack';
// import { MainTabNavigator } from './tabs/MainTabNavigator';

// // ============================================
// // MODAL SCREENS (Root Level - Tab Dışında)
// // ============================================
// import {
//   // Match Screens
//   MatchDetailScreen,
//   MatchRegistrationScreen,
//   TeamBuildingScreen,
//   ScoreEntryScreen,
//   GoalAssistEntryScreen,
//   PlayerRatingScreen,
//   PaymentTrackingScreen,

//   // Player Screens
//   SelectPositionsScreen,

//   // Edit Match Screen
//   EditMatchScreen,
// } from '../screens';
// import { isProfileComplete } from '../helper/helper';

// const Stack = createNativeStackNavigator<RootStackParamList>();

// export const RootNavigator: React.FC = () => {
//   const { user, isVerified } = useAppContext();
//   const isAuthenticated = user && isVerified && isProfileComplete(user);

//   // Eğer auth state henüz yüklenmediyse (ör: user undefined/null ve isVerified false/null)
//   // bir loading spinner göster, navigation'ı render etme
//   if (user === undefined || isVerified === undefined) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
//         <ActivityIndicator size="large" color="#16a34a" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <NavigationContainer
//         ref={navigationRef}
//         linking={linking}
//       >
//         <Stack.Navigator
//           screenOptions={{
//             headerShown: false,
//             animation: 'slide_from_right',
//           }}
//         >
//           {!isAuthenticated ? (
//             <Stack.Screen
//               name="Auth"
//               component={AuthStack}
//               options={{
//                 animationTypeForReplace: !isAuthenticated ? 'pop' : 'push',
//               }}
//             />
//           ) : (
//             <>
//               <Stack.Screen
//                 name="Main"
//                 component={MainTabNavigator}
//               />
//               <Stack.Screen
//                 name="matchDetail"
//                 component={MatchDetailScreen}
//                 options={{
//                   title: 'Maç Detayı',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="matchRegistration"
//                 component={MatchRegistrationScreen}
//                 options={{
//                   title: 'Maça Kayıt Ol',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="teamBuilding"
//                 component={TeamBuildingScreen}
//                 options={{
//                   title: 'Takım Kur',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="scoreEntry"
//                 component={ScoreEntryScreen}
//                 options={{
//                   title: 'Skor Gir',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="goalAssistEntry"
//                 component={GoalAssistEntryScreen}
//                 options={{
//                   title: 'Gol & Asist',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="playerRating"
//                 component={PlayerRatingScreen}
//                 options={{
//                   title: 'Oyuncu Puanlama',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="paymentTracking"
//                 component={PaymentTrackingScreen}
//                 options={{
//                   title: 'Ödeme Takibi',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="selectPositions"
//                 component={SelectPositionsScreen}
//                 options={{
//                   title: 'Pozisyon Seçimi',
//                   presentation: 'transparentModal',
//                   animation: 'fade',
//                   headerShown: false,
//                 }}
//               />
//               <Stack.Screen
//                 name="editMatch"
//                 component={EditMatchScreen}
//                 options={{
//                   title: 'Maçı Düzenle',
//                   presentation: 'modal',
//                   animation: 'slide_from_bottom',
//                   headerShown: false,
//                 }}
//               />
//             </>
//           )}
//         </Stack.Navigator>
//       </NavigationContainer>
//       {isAuthenticated && <SideMenu />}
//     </>
//   );
// };