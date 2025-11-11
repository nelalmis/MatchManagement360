import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CreateFixtureRouteProp, FixtureNavigationService, goBack } from '../../navigation';
import { useAuth } from '../../hooks';
import { ILeague, IPlayer } from '../../types/entity/types';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import PlayerService from '../../services/serviceLayer/playerService';
import { FixtureForm, FixtureFormData } from './components/FixtureForm';
import { LoadingScreen } from '../Common';

export const CreateFixtureScreen: React.FC = () => {
  const route = useRoute<CreateFixtureRouteProp>();
  const { user } = useAuth();
  const leagueId = route.params.leagueId;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<Record<string, IPlayer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const leagueResponse = await LeagueService.getLeague(leagueId);
      if (!leagueResponse.success || !leagueResponse.data) {
        Alert.alert('Hata', 'Lig bulunamadı');
        goBack();
        return;
      }

      setLeague(leagueResponse.data);

      const playersResult = await PlayerService.getPlayersByIds(leagueResponse.data.members.all);
      if (playersResult.success && playersResult.data) {
        const playersMap: Record<string, IPlayer> = {};
        playersResult.data.forEach(player => {
          playersMap[player.id] = player;
        });
        setLeagueMembers(playersMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FixtureFormData) => {
    if (!league || !user?.id) return;

    try {
      const fixtureData = {
        leagueId: league.id,
        organizerId: user.id,
        title: formData.title,
        description: formData.description,
        schedule: {
          matchStartTime: formData.matchStartTime,
          matchDuration: formData.matchDuration,
          registrationSchedule: formData.registrationSchedule,
          isRecurring: formData.isRecurring,
          pattern: formData.pattern,
        },
        squad: formData.squad,
        venue: formData.venue,
        players: formData.playerLists,
        permissions: {
          organizers: formData.permissions.organizers.length > 0 
            ? formData.permissions.organizers 
            : [user.id],
          teamBuilders: formData.permissions.teamBuilders,
        },
      };

      const response = await FixtureService.createFixture(fixtureData);

      if (response.success && response.data) {
        Alert.alert('Başarılı! 🎉', 'Fikstür başarıyla oluşturuldu', [
          {
            text: 'Tamam',
            onPress: () => FixtureNavigationService.navigateToFixtureDetail(response.data!.id),
          },
        ]);
      } else {
        Alert.alert('Hata', response.error?.message || 'Fikstür oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Error creating fixture:', error);
      Alert.alert('Hata', error.message || 'Fikstür oluşturulurken bir hata oluştu');
    }
  };

  if (loading || !league) {
    return <LoadingScreen />;
  }

  return (
    <FixtureForm
      mode="create"
      league={league}
      leagueMembers={leagueMembers}
      onSubmit={handleSubmit}
      onCancel={() => goBack()}
    />
  );
};