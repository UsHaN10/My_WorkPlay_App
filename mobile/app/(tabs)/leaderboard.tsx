import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Trophy, Medal, Award, Swords } from 'lucide-react-native';
import { getLeaderboard } from '../../services/api';

export default function LeaderboardScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadLeaderboard = async () => {
        try {
            const data = await getLeaderboard();
            // data returns sorted users: id, username, fullName, points, rank, etc.
            setUsers(data);
        } catch (err) {
            console.error('Failed to load leaderboard', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadLeaderboard();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadLeaderboard();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={24} color="#fbbf24" />; // Gold
        if (index === 1) return <Medal size={24} color="#9ca3af" />; // Silver
        if (index === 2) return <Award size={24} color="#b45309" />; // Bronze
        return <Text style={styles.rankNumber}>{index + 1}</Text>;
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
            >
                <View style={styles.header}>
                    <Trophy size={48} color="#fbbf24" />
                    <Text style={styles.title}>Top Performers</Text>
                    <Text style={styles.subtitle}>Climb the ranks and earn rewards!</Text>
                </View>

                <View style={styles.listContainer}>
                    {users.map((user, index) => (
                        <View key={user.id} style={[styles.userCard, index < 3 && styles.top3Card]}>
                            <View style={styles.rankBadge}>
                                {getRankIcon(index)}
                            </View>

                            {user.profilePicUrl ? (
                                <Image source={{ uri: user.profilePicUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}

                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.fullName || user.username}</Text>
                                <Text style={styles.userRank}>{user.rank || 'Worker'}</Text>
                            </View>

                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>{user.points} pts</Text>
                            </View>
                        </View>
                    ))}
                    {users.length === 0 && (
                        <Text style={styles.emptyText}>No users on the leaderboard yet.</Text>
                    )}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.pvpFab} onPress={() => router.push('/matchmaking?gameType=arena')}>
                <Swords size={32} color="#ffffff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 16,
        color: '#9ca3af',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    top3Card: {
        backgroundColor: '#334155', // slightly lighter for top 3
        borderColor: '#475569',
        borderWidth: 1,
    },
    rankBadge: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    userRank: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
    },
    pointsBadge: {
        backgroundColor: '#fbbf2420', // transparent yellow
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pointsText: {
        color: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    pvpFab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#ef4444',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    }
});
