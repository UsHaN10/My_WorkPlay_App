import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Gift, X, Star } from 'lucide-react-native';

const REWARDS = [
    '50 XP', 'Bronze Badge', '100 Coins', 'Energy Refill',
    'Silver Badge', '500 XP', 'Mystery Box', 'Nothing'
];
const SEGMENT_ANGLE = 360 / REWARDS.length;

export default function DailySpinModal() {
    const router = useRouter();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const [spinning, setSpining] = useState(false);
    const [reward, setReward] = useState<string | null>(null);

    const [spinSound, setSpinSound] = useState<Audio.Sound | null>(null);

    React.useEffect(() => {
        const checkDailySpin = async () => {
            try {
                const lastSpin = await AsyncStorage.getItem('lastSpinDate');
                if (lastSpin === new Date().toDateString()) {
                    setReward('Already spun');
                }
            } catch (e) { }
        };
        checkDailySpin();
    }, []);

    const startSpin = async () => {
        if (spinning || reward) return;
        setSpining(true);

        let soundObj: Audio.Sound | null = null;
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/coin.wav')
            );
            soundObj = sound;
            await soundObj.setIsLoopingAsync(true);
            await soundObj.playAsync();
        } catch (e) {
            console.error('Audio load error', e);
        }

        const randomRotations = Math.floor(Math.random() * 5) + 5; // 5 to 10 full spins
        const randomIndex = Math.floor(Math.random() * REWARDS.length);
        const stopAngle = (randomRotations * 360) + (randomIndex * SEGMENT_ANGLE);

        Animated.timing(spinAnim, {
            toValue: stopAngle,
            duration: 5000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(async () => {
            setSpining(false);

            if (soundObj) {
                await soundObj.stopAsync();
                await soundObj.setIsLoopingAsync(false);
                await soundObj.playAsync(); // final pop
            }

            const winningIndex = (REWARDS.length - randomIndex) % REWARDS.length;
            const won = REWARDS[winningIndex];
            setReward(won);

            try {
                await AsyncStorage.setItem('lastSpinDate', new Date().toDateString());
            } catch (e) { }

            Vibration.vibrate([0, 100, 100, 100]); // fanfare
            Alert.alert('Congratulations!', `You won: ${won}`);
        });
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <X size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>Daily Lucky Spin</Text>
            <Text style={styles.subtitle}>Spin the wheel to earn powerful RPG drops!</Text>

            <View style={styles.wheelContainer}>
                {/* The Arrow */}
                <View style={styles.arrow} />

                {/* The Wheel */}
                <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
                    {REWARDS.map((item, index) => (
                        <View
                            key={index}
                            style={[
                                styles.segment,
                                { transform: [{ rotate: `${index * SEGMENT_ANGLE}deg` }] }
                            ]}
                        >
                            <Text style={styles.segmentText}>{item}</Text>
                        </View>
                    ))}
                    <View style={styles.wheelCenter}>
                        <Star color="#f59e0b" size={32} />
                    </View>
                </Animated.View>
            </View>

            <TouchableOpacity
                style={[styles.spinButton, (spinning || reward) && { opacity: 0.5 }]}
                onPress={startSpin}
                disabled={spinning || reward !== null}
            >
                <Text style={styles.spinButtonText}>{reward ? 'Come back tomorrow!' : 'SPIN NOW'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        padding: 10,
        backgroundColor: '#1e293b',
        borderRadius: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fbbf24',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 40,
    },
    wheelContainer: {
        width: 320,
        height: 320,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    arrow: {
        position: 'absolute',
        top: -20,
        zIndex: 10,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderBottomWidth: 30,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#ef4444',
        transform: [{ rotate: '180deg' }],
    },
    wheel: {
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#1e293b',
        borderWidth: 4,
        borderColor: '#3b82f6',
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wheelCenter: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    segment: {
        position: 'absolute',
        width: 150,
        height: 300,
        right: 150,
        alignItems: 'flex-end',
        justifyContent: 'center',
        transformOrigin: 'right center',
    },
    segmentText: {
        color: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 12,
        width: 100,
        textAlign: 'center',
    },
    spinButton: {
        backgroundColor: '#fbbf24',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    spinButtonText: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 20,
    }
});
