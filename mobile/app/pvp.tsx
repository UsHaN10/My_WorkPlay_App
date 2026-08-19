import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { Swords, Shell as Shield, Zap, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function PvPArenaModal() {
    const router = useRouter();
    const [searching, setSearching] = useState(false);
    const [matchFound, setMatchFound] = useState(false);

    const startSearch = () => {
        setSearching(true);
        setTimeout(() => {
            setSearching(false);
            setMatchFound(true);
        }, 2500); // Simulate network pinging
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <X size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.header}>
                <Swords size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <Text style={styles.title}>Ranked PvP Arena</Text>
                <Text style={styles.subtitle}>Challenge coworkers to a 24-hour Productivity Duel. Winner takes 500 Coins!</Text>
            </View>

            {!matchFound ? (
                <View style={styles.matchmakingBox}>
                    {searching ? (
                        <View style={styles.searching}>
                            <ActivityIndicator size="large" color="#ef4444" />
                            <Text style={styles.searchingText}>Finding an opponent of equal rank...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.battleBtn} onPress={startSearch}>
                            <Text style={styles.battleBtnText}>FIND MATCH</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.versusContainer}>
                    <Text style={styles.vsText}>VS</Text>

                    <View style={styles.playerCard}>
                        <Text style={styles.playerName}>You (LV 14)</Text>
                        <View style={styles.hpBar}><View style={styles.hpFill} /></View>
                        <Text style={styles.statsText}>Current Output: 0 Tasks</Text>
                    </View>

                    <View style={styles.playerCardEnemy}>
                        <Text style={styles.playerName}>Alex_Smith (LV 15)</Text>
                        <View style={styles.hpBar}><View style={[styles.hpFill, { backgroundColor: '#ef4444' }]} /></View>
                        <Text style={styles.statsText}>Current Output: 0 Tasks</Text>
                    </View>

                    <TouchableOpacity style={styles.acceptBattle} onPress={() => router.back()}>
                        <Text style={styles.acceptText}>ACCEPT DUEL & RETURN TO WORK</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 24,
        justifyContent: 'center'
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        padding: 10,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        zIndex: 10
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#f8fafc',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    matchmakingBox: {
        alignItems: 'center',
    },
    battleBtn: {
        backgroundColor: '#ef4444',
        paddingVertical: 18,
        paddingHorizontal: 64,
        borderRadius: 30,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    battleBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 24,
    },
    searching: {
        alignItems: 'center'
    },
    searchingText: {
        color: '#ef4444',
        marginTop: 16,
        fontWeight: 'bold'
    },
    versusContainer: {
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 24,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#334155'
    },
    vsText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#ef4444',
        position: 'absolute',
        top: '35%',
        zIndex: 10,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    playerCard: {
        width: '100%',
        padding: 20,
        backgroundColor: '#3b82f620',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3b82f6'
    },
    playerCardEnemy: {
        width: '100%',
        padding: 20,
        backgroundColor: '#ef444420',
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#ef4444'
    },
    playerName: {
        color: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
    },
    hpBar: {
        width: '100%',
        height: 12,
        backgroundColor: '#0f172a',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    hpFill: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3b82f6',
    },
    statsText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    acceptBattle: {
        backgroundColor: '#ef4444',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    acceptText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
