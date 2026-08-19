import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Store, Coins, Shield, Cat } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import { getUser } from '../../services/api';

const SHOP_ITEMS = [
    { id: 1, type: 'skin', name: 'Cybernetic Arm', cost: 1500, category: 'Avatar Skins' },
    { id: 2, type: 'skin', name: 'Neon Visor', cost: 800, category: 'Avatar Skins' },
    { id: 3, type: 'pet', name: 'Drone Companion', cost: 4000, category: 'Virtual Pets' },
    { id: 4, type: 'pet', name: 'Robo-Dog', cost: 3500, category: 'Virtual Pets' },
    { id: 5, type: 'badge', name: 'Safety Inspector', cost: 200, category: 'Badges' },
];

export default function ShopScreen() {
    const auth = useAuth();
    const [coins, setCoins] = useState(0);

    const fetchCoins = async () => {
        if (auth?.user?.id) {
            try {
                const userData = await getUser(auth.user.id);
                if (userData && userData.coins !== undefined) {
                    setCoins(userData.coins);
                }
            } catch (e) { console.error('Failed to get real coins inside shop', e); }
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCoins();
        }, [auth?.user?.id])
    );

    const renderIcon = (type: string) => {
        switch (type) {
            case 'skin': return <Shield size={32} color="#3b82f6" />;
            case 'pet': return <Cat size={32} color="#10b981" />;
            default: return <Coins size={32} color="#fbbf24" />;
        }
    };

    const handleBuy = async (item: any) => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/coin.wav')
            );
            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if ('didJustFinish' in status && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log('Error playing sound: ', error);
        }

        setCoins(prev => prev - item.cost);
        Alert.alert('Purchase Successful!', `You bought the ${item.name} for ${item.cost} WPC!`);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Store size={32} color="#f8fafc" style={{ marginRight: 12 }} />
                    <Text style={styles.title}>Company Store</Text>
                </View>
                <View style={styles.coinBadge}>
                    <Coins size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                    <Text style={styles.coinBalance}>{coins}</Text>
                </View>
            </View>

            <Text style={styles.desc}>Spend your hard-earned XP coins on visual upgrades and rank modifiers!</Text>

            <View style={styles.storeGrid}>
                {SHOP_ITEMS.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemIconBox}>
                            {renderIcon(item.type)}
                        </View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCategory}>{item.category}</Text>

                        <TouchableOpacity
                            style={[styles.buyBtn, coins < item.cost && styles.buyBtnDisabled]}
                            disabled={coins < item.cost}
                            onPress={() => handleBuy(item)}
                        >
                            <Text style={styles.buyBtnText}>{item.cost} Coins</Text>
                        </TouchableOpacity>
                    </View>
                ))}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    coinBadge: {
        flexDirection: 'row',
        backgroundColor: '#fbbf2420',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
    },
    coinBalance: {
        color: '#fbbf24',
        fontWeight: '900',
        fontSize: 16,
    },
    desc: {
        padding: 20,
        color: '#94a3b8',
        fontSize: 14,
        lineHeight: 20,
    },
    storeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    itemCard: {
        width: '45%',
        backgroundColor: '#1e293b',
        margin: '2.5%',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    itemIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: {
        color: '#f8fafc',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    itemCategory: {
        color: '#9ca3af',
        fontSize: 11,
        marginBottom: 16,
    },
    buyBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    buyBtnDisabled: {
        backgroundColor: '#475569',
    },
    buyBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
