
import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { EditFixtureRouteProp, goBack } from '../../navigation';
import { useAuth } from '../../hooks';
import { IFixture, ILeague, IPlayer } from '../../types/entity/types';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import PlayerService from '../../services/serviceLayer/playerService';
import { FixtureForm, FixtureFormData } from './components/FixtureForm';

export const EditFixtureScreen: React.FC = () => {
  const route = useRoute<EditFixtureRouteProp>();
  const { user } = useAuth();
  const fixtureId = route.params.fixtureId;

  const [fixture, setFixture] = useState<IFixture | null>(null);
  const [league, setLeague] = useState<ILeague | null>(null);
  const [leagueMembers, setLeagueMembers] = useState<Record<string, IPlayer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFixture();
  }, [fixtureId]);

  const loadFixture = async () => {
    try {
      setLoading(true);

      const fixtureResponse = await FixtureService.getFixture(fixtureId);
      if (!fixtureResponse.success || !fixtureResponse.data) {
        Alert.alert('Hata', 'Fikstür bulunamadı');
        goBack();
        return;
      }

      const fixtureData = fixtureResponse.data;
      setFixture(fixtureData);

      const leagueResponse = await LeagueService.getLeague(fixtureData.leagueId);
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
      console.error('Error loading fixture:', error);
      Alert.alert('Hata', 'Fikstür yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FixtureFormData) => {
    if (!fixture || !user?.id) return;

    try {
      // Call individual update methods
      await FixtureService.updateBasicInfo(fixtureId, user.id, {
        title: formData.title,
        description: formData.description,
      });

      await FixtureService.updateVenue(fixtureId, user.id, formData.venue);

      await FixtureService.updateSchedule(fixtureId, user.id, {
        matchStartTime: formData.matchStartTime,
        matchDuration: formData.matchDuration,
        registrationSchedule: formData.registrationSchedule,
        isRecurring: formData.isRecurring,
        pattern: formData.pattern,
      });

      await FixtureService.updateSquad(fixtureId, user.id, formData.squad);

      // Update player lists if changed
      const currentInherit = fixture.players.premium.mode === 'auto' && fixture.players.direct.mode === 'auto';
      const newInherit = formData.playerLists.premium.mode === 'auto' && formData.playerLists.direct.mode === 'auto';

      if (currentInherit !== newInherit) {
        if (newInherit) {
          await FixtureService.switchToAutoMode(fixtureId, user.id, 'premium');
          await FixtureService.switchToAutoMode(fixtureId, user.id, 'direct');
        } else {
          await FixtureService.switchToCustomMode(
            fixtureId, 
            user.id, 
            'premium', 
            formData.playerLists.premium.overrides || []
          );
          await FixtureService.switchToCustomMode(
            fixtureId, 
            user.id, 
            'direct', 
            formData.playerLists.direct.overrides || []
          );
        }
      }

      Alert.alert('✅ Başarılı', 'Fikstür güncellendi', [
        {
          text: 'Tamam',
          onPress: () => goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating fixture:', error);
      Alert.alert('Hata', error.message || 'Fikstür güncellenirken bir hata oluştu');
    }
  };

  if (loading || !fixture || !league) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <FixtureForm
      mode="edit"
      league={league}
      leagueMembers={leagueMembers}
      initialData={fixture}
      onSubmit={handleSubmit}
      onCancel={() => goBack()}
    />
  );
};