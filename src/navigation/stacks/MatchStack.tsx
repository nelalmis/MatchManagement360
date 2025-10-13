// // ============================================
// // MATCH STACK
// // ============================================
// // Maç ile ilgili tüm ekranlar
// // Not: Bu ekranlar genellikle Root level'da modal olarak açılıyor
// // Ancak stack yapısı için burada tanımlıyoruz

// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// // Screens
// import { 
//   MatchDetailScreen,
//   MatchRegistrationScreen,
//   TeamBuildingScreen,
//   ScoreEntryScreen,
//   PaymentTrackingScreen
// } from '../../screens';

// const Stack = createNativeStackNavigator<MatchStackParamList>();

// export const MatchStack: React.FC = () => {
//   return (
//     <Stack.Navigator
//       screenOptions={{
//         headerShown: true,
//         headerStyle: {
//           backgroundColor: '#16a34a',
//         },
//         headerTintColor: '#fff',
//         headerTitleStyle: {
//           fontWeight: '700',
//           fontSize: 18,
//         },
//         headerBackTitleVisible: false,
//         animation: 'slide_from_right',
//         gestureEnabled: true,
//       }}
//     >
//       <Stack.Screen 
//         name="matchList" 
//         component={MatchDetailScreen}
//         options={{
//           title: 'Maçlar',
//         }}
//       />
      
//       <Stack.Screen 
//         name="matchRegistration" 
//         component={MatchRegistrationScreen}
//         options={{
//           title: 'Maça Kayıt Ol',
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//         }}
//       />
      
//       <Stack.Screen 
//         name="teamBuilding" 
//         component={TeamBuildingScreen}
//         options={{
//           title: 'Takım Kur',
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerStyle: {
//             backgroundColor: '#2563EB',
//           },
//         }}
//       />
      
//       <Stack.Screen 
//         name="scoreEntry" 
//         component={ScoreEntryScreen}
//         options={{
//           title: 'Skor Gir',
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerStyle: {
//             backgroundColor: '#DC2626',
//           },
//         }}
//       />
      
//       <Stack.Screen 
//         name="paymentTracking" 
//         component={PaymentTrackingScreen}
//         options={{
//           title: 'Ödeme Takibi',
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerStyle: {
//             backgroundColor: '#F59E0B',
//           },
//         }}
//       />
//     </Stack.Navigator>
//   );
// };