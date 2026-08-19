import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Radar, X } from 'lucide-react-native';
import { getSocket } from '../services/api';

export default function MatchmakingScreen() {
    const router = useRouter();
    const { gameType } = useLocalSearchParams();
    const [status, setStatus] = useState('Connecting to Server...');
    const [socket, setSocket] = useState<any>(null);

    // Radar Animation
    const spinAnim = new Animated.Value(0);
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const newSocket = getSocket();

        const onConnect = () => {
            setStatus('Searching for Opponent...');
            newSocket.emit('join_matchmaking', gameType || 'pvp-pong');
        };

        const onMatch = (data: any) => {
            setStatus('Match Found! Starting game...');
            setTimeout(() => {
                // Remove listeners but don't disconnect the global socket!
                newSocket.off('connect', onConnect);
                newSocket.off('match_found', onMatch);

                router.replace({
                    pathname: `/${gameType || 'pvp-pong'}` as any,
                    params: { matchId: data.matchId, role: data.opponentRole === 'p1' ? 'p2' : 'p1' }
                });
            }, 1000);
        };

        newSocket.on('connect', onConnect);
        newSocket.on('match_found', onMatch);

        // If already connected before this screen loaded
        if (newSocket.connected) {
            onConnect();
        }

        setSocket(newSocket);

        return () => {
            // Unmount cleanup
            newSocket.off('connect', onConnect);
            newSocket.off('match_found', onMatch);
            newSocket.emit('leave_matchmaking', gameType || 'pvp-pong');
        };
    }, []);

    const handleCancel = () => {
        if (socket) {
            socket.emit('leave_matchmaking', gameType || 'pvp-pong');
        }
        router.back();
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleCancel}>
                <X size={28} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={styles.title}>MATCHMAKING</Text>
                <Text style={styles.gameType}>({(gameType as string || 'pong').toUpperCase()})</Text>

                <View style={styles.radarContainer}>
                    <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Radar size={80} color="#3b82f6" />
                    </Animated.View>
                </View>

                <Text style={styles.status}>{status}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    closeBtn: {
        marginTop: 50,
        marginLeft: 20,
        alignSelf: 'flex-start',
        padding: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: '#f8fafc',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    gameType: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 2,
    },
    radarContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 40,
        position: 'relative'
    },
    pulseCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    status: {
        color: '#94a3b8',
        fontSize: 16,
        fontStyle: 'italic',
    }
});
