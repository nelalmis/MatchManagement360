// src/hooks/index.ts
// Redux hooks (typed)
export { useAppDispatch, useAppSelector } from '../store/hooks';

// Feature hooks
export { useAuth } from './useAuth';
export { useLeague } from './useLeague';
export { useMatch } from './useMatch';

// Utility hooks
export { useDebounce } from './useDebounce';
export { useKeyboard } from './useKeyboard';



/* 

// Component'te kullanım
import { useAuth, useLeague, useMatch, useDebounce } from '../hooks';

function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { myLeagues, loadMyLeagues } = useLeague();
  const { upcomingMatches, loadUpcomingMatches } = useMatch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch) {
      // Search çalışır
    }
  }, [debouncedSearch]);

  return (
    <View>
      <Text>{user?.displayName}</Text>
      <FlatList data={myLeagues} />
    </View>
  );
}


// screens/leagues/LeaguesListScreen.tsx
import React, { useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useLeague } from '../../hooks';

export default function LeaguesListScreen() {
  const {
    myLeagues,
    loading,
    error,
    loadMyLeagues,
  } = useLeague();

  useEffect(() => {
    loadMyLeagues();
  }, [loadMyLeagues]);

  if (loading.leagues) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <FlatList
        data={myLeagues}
        renderItem={({ item }) => (
          <Text>{item.title}</Text>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
*/