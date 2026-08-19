import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Star, Shield, ArrowUp, Lock } from 'lucide-react-native';

const RANKS = [
    { name: 'Novice', minXp: 0, maxXp: 99, color: '#94a3b8', seed: 'NoviceR' },
    { name: 'Bronze', minXp: 100, maxXp: 499, color: '#b45309', seed: 'BronzeX' },
    { name: 'Silver', minXp: 500, maxXp: 999, color: '#9ca3af', seed: 'SilverM' },
    { name: 'Gold', minXp: 1000, maxXp: 2999, color: '#fbbf24', seed: 'GoldKing' },
    { name: 'Platiner', minXp: 3000, maxXp: 4999, color: '#38bdf8', seed: 'PlatinumStar' },
    { name: 'Diamond', minXp: 5000, maxXp: 999999, color: '#c026d3', seed: 'DiamondQueen' }
];

export default function RanksScreen() {
    const { user, profile } = useAuth() || {};
    const xp = profile?.xp || user?.xp || 0;
    const currentRankName = profile?.rank || user?.rank || 'Novice';
    const currentRankIndex = RANKS.findIndex(r => r.name.toLowerCase() === currentRankName.toLowerCase()) || 0;

    // Setup API-based Models for ranks (using Dicebear API for unique geometric models)
    const getLogoUrl = (seed: string) => `https://api.dicebear.com/7.x/shapes/png?seed=${seed}&radius=50&size=120`;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
                <Trophy size={48} color="#fbbf24" />
                <Text style={styles.title}>Rank Progression</Text>
                <Text style={styles.subtitle}>Current XP: {xp}</Text>
            </View>

            <View style={styles.timeline}>
                {RANKS.map((rank, idx) => {
                    const isUnlocked = xp >= rank.minXp;
                    const isCurrent = idx === currentRankIndex;
                    const isNext = idx === currentRankIndex + 1;

                    let progressPercent = 0;
                    if (isUnlocked) progressPercent = 100;
                    if (isCurrent && rank.maxXp !== 999999) {
                        const range = rank.maxXp - rank.minXp;
                        const currentInsn = xp - rank.minXp;
                        progressPercent = Math.min(100, Math.floor((currentInsn / range) * 100));
                    }

                    return (
                        <View key={idx} style={[styles.rankCard, isCurrent && styles.currentCard]}>
                            {/* API Model Logo */}
                            <View style={[styles.logoContainer, !isUnlocked && styles.lockedLogo]}>
                                <Image source={{ uri: getLogoUrl(rank.seed) }} style={styles.rankLogo} />
                                {!isUnlocked && (
                                    <View style={styles.lockOverlay}>
                                        <Lock size={24} color="#f8fafc" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.rankDetails}>
                                <View style={styles.rankHeader}>
                                    <Text style={[styles.rankName, { color: isUnlocked ? rank.color : '#64748b' }]}>
                                        {rank.name.toUpperCase()}
                                    </Text>
                                    {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentText}>CURRENT</Text></View>}
                                </View>

                                <Text style={styles.xpReq}>
                                    {isUnlocked ? `${rank.minXp}+ XP (Unlocked)` : `Requires ${rank.minXp} XP`}
                                </Text>

                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: isUnlocked ? rank.color : '#334155' }]} />
                                </View>
                                {isCurrent && (
                                    <Text style={styles.progressCounter}>{progressPercent}% to next rank</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 30,
        paddingTop: 60,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginTop: 12,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#10b981',
        fontWeight: 'bold',
    },
    timeline: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    rankCard: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#334155',
        alignItems: 'center',
    },
    currentCard: {
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    logoContainer: {
        width: 80,
        height: 80,
        marginRight: 16,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankLogo: {
        width: 80,
        height: 80,
    },
    lockedLogo: {
        opacity: 0.3,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankDetails: {
        flex: 1,
    },
    rankHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    rankName: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    currentBadge: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    currentText: {
        color: '#0f172a',
        fontSize: 10,
        fontWeight: '900',
    },
    xpReq: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 10,
    },
    progressBg: {
        height: 8,
        backgroundColor: '#0f172a',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    progressCounter: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 6,
        textAlign: 'right',
    }
});
