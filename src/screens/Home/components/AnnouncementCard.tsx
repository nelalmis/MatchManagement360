import React, { } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import {
    ChevronRight,
    AlertCircle,
    X,
    Info,
    AlertTriangle,
    Check,
} from 'lucide-react-native';
import {
    IAnnouncement,
} from '../../../types/entity/types';

interface AnnouncementCardProps {
    announcement: IAnnouncement;
    onDismiss: () => void;
    onAction?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
    announcement,
    onDismiss,
    onAction,
}) => {
    const getTypeColor = (type: IAnnouncement['type']) => {
        const colors = {
            info: '#2563EB',
            warning: '#F59E0B',
            success: '#16a34a',
            error: '#EF4444',
        };
        return colors[type];
    };

    const getTypeIcon = (type: IAnnouncement['type']) => {
        const color = getTypeColor(type);
        switch (type) {
            case 'info':
                return <Info size={20} color={color} strokeWidth={2} />;
            case 'warning':
                return <AlertCircle size={20} color={color} strokeWidth={2} />;
            case 'success':
                return <Check size={20} color={color} strokeWidth={2} />;
            case 'error':
                return <AlertTriangle size={20} color={color} strokeWidth={2} />;
        }
    };

    const color = getTypeColor(announcement.type);

    return (
        <View style={[styles.announcementCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.announcementHeader}>
                <View style={[styles.announcementIconContainer, { backgroundColor: `${color}20` }]}>
                    {getTypeIcon(announcement.type)}
                </View>

                {announcement.display.dismissable && (
                    <TouchableOpacity
                        onPress={onDismiss}
                        style={styles.dismissButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={20} color="#9CA3AF" strokeWidth={2} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            <Text style={styles.announcementMessage}>{announcement.message}</Text>

            {announcement.action && (
                <TouchableOpacity
                    style={[styles.announcementAction, { backgroundColor: color }]}
                    onPress={onAction}
                    activeOpacity={0.7}
                >
                    <Text style={styles.announcementActionText}>{announcement.action.label}</Text>
                    <ChevronRight size={16} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({

    // Announcement Card
    announcementCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    announcementIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dismissButton: {
        padding: 4,
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    announcementMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    announcementAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 4,
    },
    announcementActionText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },

});