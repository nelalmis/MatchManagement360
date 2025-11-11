
import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    Animated,
    StyleSheet,
    AppState,
    AppStateStatus,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FabMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    onPress: () => void;
}

interface FabProps {
    mainColor: string;
    menuItems: FabMenuItem[];
    visible?: boolean;
    autoHideOnScroll?: boolean;
    onScrollY?: Animated.Value;
}

export const Fab: React.FC<FabProps> = ({
    mainColor,
    menuItems,
    visible = true,
    autoHideOnScroll = false,
    onScrollY,
}) => {
    const [fabExpanded, setFabExpanded] = useState(false);
    const fabScale = useRef(new Animated.Value(1)).current;
    const fabRotation = useRef(new Animated.Value(0)).current;
    const lastScrollY = useRef(0);
    const scrollDirection = useRef(new Animated.Value(1)).current;
    const currentScrollDirection = useRef(1); // Track current state

    const insets = useSafeAreaInsets();

    // Handle app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
            // Reset animations to their correct state when app becomes active
            scrollDirection.setValue(currentScrollDirection.current);
            fabRotation.setValue(fabExpanded ? 1 : 0);
            fabScale.setValue(1);
        }
    };
    // Scroll event listener
    useEffect(() => {
        if (!autoHideOnScroll || !onScrollY) return;

        const listenerId = onScrollY.addListener(({ value }) => {
            const diff = value - lastScrollY.current;

            if (diff > 5) {
                // Scrolling down - hide FAB
                currentScrollDirection.current = 0;
                Animated.spring(scrollDirection, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                }).start();
                closeFabMenu();
            } else if (diff < -5) {
                // Scrolling up - show FAB
                currentScrollDirection.current = 1;
                Animated.spring(scrollDirection, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 8,
                }).start();
            }

            lastScrollY.current = value;
        });

        return () => {
            onScrollY.removeListener(listenerId);
        };
    }, [autoHideOnScroll, onScrollY]);

    const fabOpacity = autoHideOnScroll
        ? scrollDirection
        : fabScale;

    const fabTranslateY = autoHideOnScroll
        ? scrollDirection.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
        })
        : 0;

    const toggleFabMenu = () => {
        const toValue = fabExpanded ? 0 : 1;

        setFabExpanded(!fabExpanded);

        Animated.spring(fabRotation, {
            toValue,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const closeFabMenu = () => {
        if (fabExpanded) {
            setFabExpanded(false);
            Animated.spring(fabRotation, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        }
    };

    const fabRotationInterpolate = fabRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            {fabExpanded && (
                <TouchableOpacity
                    style={styles.fabBackdrop}
                    activeOpacity={1}
                    onPress={closeFabMenu}
                />
            )}

            {/* FAB Menu Items */}
            {fabExpanded && (
                <Animated.View style={[styles.fabMenu, { bottom: 15 + 72 + insets.bottom }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.fabMenuItem}
                            onPress={() => {
                                closeFabMenu();
                                item.onPress();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.fabMenuLabelContainer}>
                                <Text style={styles.fabMenuLabel}>{item.label}</Text>
                            </View>
                            <View style={[styles.fabMenuButton, { backgroundColor: item.color }]}>
                                {item.icon}
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}

            {/* Main FAB Button */}

            <Animated.View
                style={[
                    styles.fabContainer,
                    {
                        bottom: 15 + insets.bottom, // 👈 safe area kadar yukarı kaldır
                        transform: [
                            { scale: fabScale },
                            { translateY: fabTranslateY },
                        ],
                        opacity: fabOpacity,
                    },
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: mainColor }]}
                    onPress={toggleFabMenu}
                    activeOpacity={0.8}
                >
                    <Animated.View
                        style={{
                            transform: [{ rotate: fabRotationInterpolate }],
                        }}
                    >
                        <Plus size={28} color="white" strokeWidth={2.5} />
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    fabBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 998,
    },
    fabMenu: {
        position: 'absolute',
        bottom: 97, //container bottom (24) + fab height (72) + 1
        right: 30,
        zIndex: 999,
        gap: 16,
        alignItems: 'flex-end',
    },
    fabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    fabMenuLabelContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    fabMenuLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    fabMenuButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },

    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 1000,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});