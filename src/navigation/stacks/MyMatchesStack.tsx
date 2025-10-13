import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyMatchesScreen } from '../../screens/Match/MyMatchesScreen';
import { StackHeader } from '../../components/StackHeader';

const Stack = createNativeStackNavigator();

export const MyMatchesStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // header: (props) => <StackHeader {...props} showMenuButton />,
        // headerTitle: 'Maçlarım',
      }}
    >
      <Stack.Screen
        name="myMatches"
        component={MyMatchesScreen}
        options={{ title: 'Maçlarım',  headerShown:false }}
      />
    </Stack.Navigator>
  );
};
