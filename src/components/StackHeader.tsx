// components/navigation/StackHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Menu, ChevronLeft, X, Plus, Search, Bell, Edit2, Save } from 'lucide-react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useSideMenu } from '../context/SideMenuContext';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';

type StackHeaderProps = (NativeStackHeaderProps | BottomTabHeaderProps) & {
    // LEFT BUTTON (Sadece biri)
    showMenuButton?: boolean;
    showBackButton?: boolean;
    showCloseButton?: boolean;

    // RIGHT BUTTONS (Opsiyonel, birden fazla olabilir)
    showSaveButton?: boolean;
    showEditButton?: boolean;
    showCreateButton?: boolean;
    showSearchButton?: boolean;
    showNotificationButton?: boolean;

    // Custom callbacks
    onSave?: () => void;
    onEdit?: () => void;
    onCreate?: () => void;
    onSearch?: () => void;
    onNotification?: () => void;
}

export const StackHeader: React.FC<StackHeaderProps> = ({
    navigation,
    route,
    options,
    showMenuButton = false,
    showBackButton = false,
    showCloseButton = false,
    showSaveButton = false,
    showEditButton = false,
    showCreateButton = false,
    showSearchButton = false,
    showNotificationButton = false,
    onSave,
    onEdit,
    onCreate,
    onSearch,
    onNotification,
}) => {
    const { openMenu } = useSideMenu();
    const title = options.title || route.name;

    const handleLeftPress = () => {
        if (showMenuButton) {
            openMenu();
        } else if (showBackButton || showCloseButton) {
            navigation.goBack();
        }
    };

    // LEFT BUTTON
    const renderLeftButton = () => {
        if (showMenuButton) {
            return (
                <TouchableOpacity style={styles.button} onPress={handleLeftPress} activeOpacity={0.7}>
                    <Menu size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showBackButton) {
            return (
                <TouchableOpacity style={styles.button} onPress={handleLeftPress} activeOpacity={0.7}>
                    <ChevronLeft size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showCloseButton) {
            return (
                <TouchableOpacity style={styles.button} onPress={handleLeftPress} activeOpacity={0.7}>
                    <X size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        return <View style={styles.button} />;
    };

    // RIGHT BUTTONS
    const renderRightButtons = () => {
        const buttons = [];

        if (showNotificationButton && onNotification) {
            buttons.push(
                <TouchableOpacity key="notification" style={styles.button} onPress={onNotification} activeOpacity={0.7}>
                    <Bell size={22} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showSearchButton && onSearch) {
            buttons.push(
                <TouchableOpacity key="search" style={styles.button} onPress={onSearch} activeOpacity={0.7}>
                    <Search size={22} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showCreateButton && onCreate) {
            buttons.push(
                <TouchableOpacity key="create" style={styles.button} onPress={onCreate} activeOpacity={0.7}>
                    <Plus size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showEditButton && onEdit) {
            buttons.push(
                <TouchableOpacity key="edit" style={styles.button} onPress={onEdit} activeOpacity={0.7}>
                    <Edit2 size={20} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (showSaveButton && onSave) {
            buttons.push(
                <TouchableOpacity key="save" style={styles.button} onPress={onSave} activeOpacity={0.7}>
                    <Save size={20} color="white" strokeWidth={2} />
                </TouchableOpacity>
            );
        }

        if (buttons.length === 0) {
            return <View style={styles.button} />;
        }

        return <View style={styles.rightButtons}>{buttons}</View>;
    };

    return (
        <View style={styles.header}>
            {renderLeftButton()}
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>
            {renderRightButtons()}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: '#16a34a',
    },
    button: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
});