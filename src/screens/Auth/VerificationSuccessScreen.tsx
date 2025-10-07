import React from 'react';
import {

    View,
    Text,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import styles from '../../styles/style';
import { useAppContext } from '../../context/AppContext';

export const VerificationSuccessScreen: React.FC = () => {
    const { phoneNumber, setPhoneNumber, setUser, setCurrentScreen } = useAppContext();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>📱</Text>
                    </View>
                    <Text style={styles.title}>Hoş Geldiniz</Text>
                    <Text style={styles.subtitle}>
                        SMS ile gönderilen kodu girin.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.successContainer}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>Başarılı!</Text>
                            <Text style={styles.successSubtitle}>
                                {1 == 1 //rememberDevice 
                                    ? 'Cihazınız kaydedildi. Bir sonraki girişinizde OTP gerekmeyecek.'
                                    : 'Hesabınız doğrulandı. Uygulamaya yönlendiriliyorsunuz...'}
                            </Text>
                            <View style={styles.progressBar}>
                                <View style={styles.progressFill} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}