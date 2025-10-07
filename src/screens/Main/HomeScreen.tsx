import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import styles from '../../styles/style';
import { formatPhoneNumber } from '../../helper/helper';
import { useAppContext } from '../../context/AppContext';
import { auth } from '../../../firestoreServices/firebaseConfig';
import { TopMenu } from '../../components/TopMenu';


export const HomeScreen: React.FC = () => {
    const { phoneNumber, setPhoneNumber, setUser, setCurrentScreen, user } = useAppContext();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.clear();
            setUser(null);
            setPhoneNumber('');
            //setVerificationCode(['', '', '', '', '', '']);
            setCurrentScreen('login');
            Alert.alert('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız.');
        } catch (error: any) {
            console.log('Logout error:', error);
            Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
        }
    };
    return (
        <View style={styles.container}>
            {/* Top Menu */}
            <TopMenu onLogout={() => console.log("")} onMenuPress={() => console.log()} />
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
                <ScrollView contentContainerStyle={styles.homeScrollContainer}>
                    <View style={styles.homeContainer}>
                        {/* Header Card */}
                        <View style={styles.homeCard}>
                            <View style={styles.homeHeader}>
                                <View>
                                    <Text style={styles.homeTitle}>Hoş Geldiniz!</Text>
                                    <Text style={styles.homePhone}>
                                        {user?.phone || `+90 ${formatPhoneNumber(phoneNumber)}`}
                                    </Text>
                                </View>
                                <View style={styles.homeAvatar}>
                                    <Text style={styles.homeAvatarIcon}>📱</Text>
                                </View>
                            </View>
                        </View>

                        {/* Device Status Card */}
                        {/* <View style={styles.homeCard}>
                        <View style={styles.deviceStatusContainer}>
                            <View style={[styles.deviceIcon, isTrustedDevice ? styles.trustedIcon : styles.standardIcon]}>
                                <Text style={styles.deviceIconText}>{isTrustedDevice ? '🛡️' : '📱'}</Text>
                            </View>
                            <View style={styles.deviceTextContainer}>
                                <Text style={styles.deviceTitle}>
                                    {isTrustedDevice ? 'Güvenilir Cihaz' : 'Standart Oturum'}
                                </Text>
                                <Text style={styles.deviceDescription}>
                                    {isTrustedDevice
                                        ? 'Bu cihazda otomatik giriş aktif. Bir sonraki açılışta OTP gerekmeyecek.'
                                        : 'Bu oturum sonunda tekrar OTP doğrulaması gerekecek.'}
                                </Text>
                            </View>
                        </View>
                    </View> */}

                        {/* Info Card */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>🔐 Firebase Auth Sistemi</Text>
                            <View style={styles.infoList}>
                                <Text style={styles.infoItem}>✓ Firebase Phone Authentication</Text>
                                <Text style={styles.infoItem}>✓ Güvenli oturum yönetimi</Text>
                                <Text style={styles.infoItem}>✓ Otomatik giriş desteği</Text>
                            </View>
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                        </TouchableOpacity>

                        <Text style={styles.lastLoginText}>
                            {/* Son giriş: {new Date(user?.lastLogin).toLocaleString('tr-TR')} */}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView >
        </View>

    );
}
