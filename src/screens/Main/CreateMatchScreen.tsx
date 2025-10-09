import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export const CreateMatchScreen: React.FC = () => {
  const [matchName, setMatchName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [playerCount, setPlayerCount] = useState('');
  const [subCount, setSubCount] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [price, setPrice] = useState('');
  const [iban, setIban] = useState('');
  const [periodic, setPeriodic] = useState(false);

  const handleSubmit = () => {
    console.log('Yeni maç oluşturuldu:', {
      matchName,
      date,
      time,
      playerCount,
      subCount,
      duration,
      location,
      fieldName,
      price,
      iban,
      periodic,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <Text style={styles.title}>Yeni Maç Oluştur</Text> */}

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maç Adı</Text>
          <TextInput
            value={matchName}
            onChangeText={setMatchName}
            placeholder="Örn: Salı Akşam Maçı"
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Maç Tarihi</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="GG/AA/YYYY"
              style={styles.input}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Saat</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="19:30"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Katılım Başlangıcı</Text>
          <TextInput
            placeholder="GG/AA/YYYY SS:DD"
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Kadro</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="10"
              style={styles.input}
              value={playerCount}
              onChangeText={setPlayerCount}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Yedek</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="2"
              style={styles.input}
              value={subCount}
              onChangeText={setSubCount}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maç Süresi (dk)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={duration}
              onValueChange={(value) => setDuration(value)}
            >
              <Picker.Item label="60" value="60" />
              <Picker.Item label="90" value="90" />
              <Picker.Item label="120" value="120" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Saha İsmi</Text>
          <TextInput
            placeholder="Arena Spor Tesisleri"
            style={styles.input}
            value={fieldName}
            onChangeText={setFieldName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lokasyon</Text>
          <TextInput
            placeholder="Adres giriniz"
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={[styles.inputGroup, styles.switchRow]}>
          <Text style={styles.label}>Periyodik Maç</Text>
          <Switch
            value={periodic}
            onValueChange={setPeriodic}
            thumbColor={periodic ? '#16a34a' : '#ccc'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maç Ücreti (₺)</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="200"
            style={styles.input}
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>IBAN</Text>
          <TextInput
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            style={styles.input}
            value={iban}
            onChangeText={setIban}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Oyuncu Davet Et</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    marginTop:10
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
