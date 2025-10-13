// navigation/stacks/FixtureStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FixtureStackParamList } from '../types';
import {
  FixtureListScreen,
  FixtureDetailScreen,
  CreateFixtureScreen,
  EditFixtureScreen,
  MatchListScreen,
  MyMatchesScreen,
} from '../../screens';
import { StackHeader } from '../../components/StackHeader';

const Stack = createNativeStackNavigator<FixtureStackParamList>();

export const FixtureStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="myMatches"
      screenOptions={{
        headerShown: true,
        presentation: 'card',
        animation: 'slide_from_right',
        gestureEnabled: true,
        headerStyle: {
          backgroundColor: '#8B5CF6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="fixtureList"
        component={FixtureListScreen}
        options={{ title: 'Maçlarım' }}
      />

      <Stack.Screen
        name="fixtureDetail"
        component={FixtureDetailScreen}
        options={{ title: 'Fikstür Detayı', 
          headerShown:false,
        }}
      />

      <Stack.Screen
        name="createFixture"
        component={CreateFixtureScreen}
        options={{
          title: 'Fikstür Oluştur',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="editFixture"
        component={EditFixtureScreen}
        options={{
          title: 'Fikstür Düzenle',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="matchList"
        component={MatchListScreen}
        options={{ title: 'Maçlar', 
          header: (props) => <StackHeader {...props} showBackButton />,
        }}
      />

      <Stack.Screen
        name="myMatches"
        component={MyMatchesScreen}
        options={{
          title: 'Maçlarım',
          header: (props) => <StackHeader {...props} showBackButton />,
        }}
      />
    </Stack.Navigator>
  );
};