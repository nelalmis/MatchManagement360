import {
    StyleSheet
} from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    homeScrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoIcon: {
        fontSize: 60,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        paddingVertical: 16,
        color: '#1F2937',
    },
    checkboxContainer: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4F46E5',
        borderRadius: 6,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#4F46E5',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxTextContainer: {
        flex: 1,
    },
    checkboxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    checkboxSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    button: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    termsText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    verificationHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    verificationIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    verificationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    verificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1F2937',
    },
    trustedDeviceNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 20,
    },
    trustedDeviceIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    trustedDeviceText: {
        flex: 1,
        fontSize: 13,
        color: '#065F46',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    countdownText: {
        fontSize: 14,
        color: '#6B7280',
    },
    countdownBold: {
        fontWeight: 'bold',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        width: '70%',
        height: '100%',
        backgroundColor: '#4F46E5',
    },
    homeContainer: {
        flex: 1,
        paddingTop: 20,
    },
    homeCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    homeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    homeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    homePhone: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    homeAvatar: {
        width: 64,
        height: 64,
        backgroundColor: '#EEF2FF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeAvatarIcon: {
        fontSize: 32,
    },
    deviceStatusContainer: {
        flexDirection: 'row',
    },
    deviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    trustedIcon: {
        backgroundColor: '#ECFDF5',
    },
    standardIcon: {
        backgroundColor: '#FEF3C7',
    },
    deviceIconText: {
        fontSize: 24,
    },
    deviceTextContainer: {
        flex: 1,
    },
    deviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    deviceDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#EEF2FF',
        borderWidth: 2,
        borderColor: '#C7D2FE',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#312E81',
        marginBottom: 12,
    },
    infoList: {
        gap: 4,
    },
    infoItem: {
        fontSize: 13,
        color: '#4338CA',
        marginBottom: 4,
    },
    logoutButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    lastLoginText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 16,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    screenContainer: { padding: 20 },
    screenTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16, color: '#555' },
    input: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
        padding: 10, marginBottom: 12, fontSize: 16
    },
});
export default styles;