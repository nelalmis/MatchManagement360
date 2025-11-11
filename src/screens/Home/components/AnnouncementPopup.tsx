import { Modal, View, StyleSheet } from "react-native";
import { IAnnouncement } from "../../../types/entity/types";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementPopupProps {
    announcement: IAnnouncement;
    onDismiss: () => void;
    onAction?: () => void;
}

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
    announcement,
    onDismiss,
    onAction,
}) => {
    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <AnnouncementCard
                        announcement={announcement}
                        onDismiss={onDismiss}
                        onAction={onAction}
                    />
                </View>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
    },
});
