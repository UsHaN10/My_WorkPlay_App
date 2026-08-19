import React, { useState, useEffect, useRef, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, Vibration } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { claimArenaWin, getUser, getSocket } from '../services/api';
import { Swords, Shield, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF, useTexture } from '@react-three/drei/native';
import * as THREE from 'three';
import { Asset } from 'expo-asset';

const MAX_HP = 100;

function resolveAssetUri(source: any) {
    if (!source) return source;
    if (typeof source === 'object' && source.uri) return source.uri;
    if (typeof source === 'number' || (typeof source === 'string' && !source.startsWith('http') && !source.startsWith('data:') && !source.startsWith('/'))) {
        return Asset.fromModule(source).uri || source;
    }
    return source;
}

function ModelViewer({ modelSource, texSource, scale = 1, position = [0, -1, 0], flip = false }: { modelSource: any, texSource?: any, scale?: number, position?: [number, number, number], flip?: boolean }) {
    const resolvedModel = resolveAssetUri(modelSource);
    const resolvedTex = resolveAssetUri(texSource);

    const gltf = useGLTF(resolvedModel as string) as any;
    const groupRef = useRef<any>(null);

    const texture = resolvedTex ? useTexture(resolvedTex as string) : null;
    if (texture) {
        (texture as any).flipY = false;
        (texture as any).colorSpace = THREE.SRGBColorSpace;
    }

    useEffect(() => {
        if (texture && gltf) {
            gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        }
    }, [texture, gltf]);

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.elapsedTime;
            groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale} rotation={[0, flip ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <primitive object={gltf.scene || gltf.nodes.Scene} />
        </group>
    );
}

const CHARACTER_TIERS = [
    { level: 1, name: 'Squire Knight', model: require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight-emb.glb'), scale: 2.3, y: -2.3 },
    { level: 5, name: 'Wild Ranger', model: require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger-emb.glb'), scale: 2.3, y: -2.3 },
    { level: 10, name: 'Arcane Mage', model: require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage-emb.glb'), scale: 2.3, y: -2.3 },
    { level: 15, name: 'Shadow Rogue', model: require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue-emb.glb'), scale: 2.3, y: -2.3 },
    { level: 20, name: 'Fierce Barbarian', model: require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian-emb.glb'), scale: 2.3, y: -2.3 },
];

export default function ArenaScreen() {
    const router = useRouter();
    const { matchId, role } = useLocalSearchParams();
    const auth = useAuth();
    const [playerHp, setPlayerHp] = useState(MAX_HP);
    const [enemyHp, setEnemyHp] = useState(MAX_HP);
    const [combatLog, setCombatLog] = useState<string[]>(['Match Started! Waiting for combat...']);
    const [turn, setTurn] = useState<'p1' | 'p2' | 'gameover'>('p1'); // p1 always starts
    const [myChar, setMyChar] = useState<any>(CHARACTER_TIERS[0]);

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const playerPos = useRef(new Animated.Value(0)).current;
    const enemyPos = useRef(new Animated.Value(0)).current;
    const hitFlash = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (auth?.user?.id) {
            getUser(auth.user.id).then(u => {
                const xp = u.xp || 0;
                const level = Math.floor(xp / 100) + 1;
                const activeChar = CHARACTER_TIERS.slice().reverse().find(c => level >= c.level) || CHARACTER_TIERS[0];
                setMyChar(activeChar);
            }).catch(console.error);
        }
    }, [auth?.user?.id]);

    useEffect(() => {
        if (!matchId) return;
        const socket = getSocket();

        const handleGameEvent = (data: any) => {
            if (data.action === 'attack') {
                const remoteIsPlayer = data.role === role;
                if (!remoteIsPlayer) {
                    executeRemoteAttack(data.damageDealt);
                }
            }
        };

        socket.on('game_event', handleGameEvent);

        return () => {
            socket.off('game_event', handleGameEvent);
            socket.emit('leave_matchmaking', 'arena');
        };
    }, [matchId, role]);

    const executeRemoteAttack = (damage: number) => {
        animateAttack(false, () => {
            addLog(`Enemy struck you for ${damage} damage!`);
            setPlayerHp(prev => {
                const p = Math.max(0, prev - damage);
                if (p === 0) handleGameOver(false);
                return p;
            });
            setTurn(role as any);
        });
    };

    const addLog = (msg: string) => {
        setCombatLog(prev => [msg, ...prev].slice(0, 4));
    };

    const triggerHitShake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true })
        ]).start();
        Vibration.vibrate([0, 50, 50, 50]);

        hitFlash.setValue(1);
        Animated.timing(hitFlash, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    };

    const animateAttack = (isPlayer: boolean, callback: () => void) => {
        const anim = isPlayer ? playerPos : enemyPos;
        const jumpDistance = isPlayer ? 60 : -60;

        Animated.sequence([
            Animated.timing(anim, { toValue: isPlayer ? -20 : 20, duration: 200, useNativeDriver: true }),
            Animated.timing(anim, { toValue: jumpDistance, duration: 150, easing: Easing.bezier(0.2, 1, 0.3, 1), useNativeDriver: true })
        ]).start(() => {
            triggerHitShake();
            Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.elastic(1), useNativeDriver: true }).start();
            callback();
        });
    };

    const handleGameOver = (playerWin: boolean) => {
        setTurn('gameover');
        setTimeout(async () => {
            if (playerWin) {
                try {
                    await claimArenaWin();
                } catch (e) {
                    console.error("Failed to claim win", e);
                }
                Alert.alert('VICTORY! 🏆', 'You defeated the rival and earned 50 WPC!', [{ text: 'Claim & Leave', onPress: () => router.back() }]);
            } else {
                Animated.timing(playerPos, { toValue: -200, duration: 800, useNativeDriver: true }).start();
                Alert.alert('DEFEAT ☠️', 'You were struck down. Better luck next time!', [{ text: 'Leave Arena', style: 'cancel', onPress: () => router.back() }]);
            }
        }, 1000);
    };

    const emitAttack = (damage: number) => {
        if (matchId) {
            getSocket().emit('game_event', {
                matchId,
                role,
                action: 'attack',
                damageDealt: damage
            });
        }
    };

    const processTurn = (playerAction: 'attack') => {
        if (turn !== role) return;

        // Perform attack visually locally instantly
        animateAttack(true, () => {
            const baseDamage = Math.floor(Math.random() * 15) + 10;
            const isCrit = Math.random() > 0.8;
            const finalDamage = isCrit ? baseDamage * 2 : baseDamage;

            if (isCrit) addLog('🔥 CRITICAL HIT!');
            addLog(`You struck for ${finalDamage} damage.`);

            emitAttack(finalDamage);

            setEnemyHp(prev => {
                const p = Math.max(0, prev - finalDamage);
                if (p === 0) handleGameOver(true);
                return p;
            });
            // Give turn to opponent
            setTurn(role === 'p1' ? 'p2' : 'p1');
        });
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
            <Animated.View style={[styles.flashOverlay, {
                backgroundColor: 'rgba(239, 68, 68, 0.4)',
                opacity: hitFlash
            }]} pointerEvents="none" />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <X size={28} color="#94a3b8" />
                </TouchableOpacity>
                <Text style={styles.title}>MULTIPLAYER ARENA</Text>
            </View>

            {/* Health Bars */}
            <View style={styles.hpHud}>
                <View style={[styles.hpSection, { opacity: turn === role ? 1.0 : 0.5 }]}>
                    <Text style={styles.hpLabel}>YOU {role ? `(${(role as string).toUpperCase()})` : ''}</Text>
                    <View style={styles.hpBarBg}>
                        <View style={[styles.hpBarFill, { width: `${(playerHp / MAX_HP) * 100}%`, backgroundColor: '#10b981' }]} />
                    </View>
                </View>
                <View style={styles.vsBadge}><Text style={styles.vsText}>VS</Text></View>
                <View style={[styles.hpSection, { alignItems: 'flex-end', opacity: turn !== role ? 1.0 : 0.5 }]}>
                    <Text style={styles.hpLabel}>OPPONENT</Text>
                    <View style={styles.hpBarBg}>
                        <View style={[styles.hpBarFill, { width: `${(enemyHp / MAX_HP) * 100}%`, backgroundColor: '#ef4444' }]} />
                    </View>
                </View>
            </View>

            {/* 3D Stage */}
            <View style={styles.stage}>
                <Animated.View style={[styles.figureContainer, { transform: [{ translateX: playerPos }] }]}>
                    <View style={styles.canvasFrame}>
                        <Canvas camera={{ position: [0, 2, 7], fov: 40 }}>
                            <ambientLight intensity={1.5} />
                            <directionalLight position={[10, 15, 10]} intensity={3} />
                            <Suspense fallback={null}>
                                <ModelViewer modelSource={myChar.model} texSource={require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Textures/colormap.png')} scale={myChar.scale} position={[0, myChar.y, 0]} flip={false} />
                            </Suspense>
                        </Canvas>
                    </View>
                    <View style={styles.shadow} />
                </Animated.View>

                <Animated.View style={[styles.figureContainer, { transform: [{ translateX: enemyPos }] }]}>
                    <View style={styles.canvasFrame}>
                        <Canvas camera={{ position: [0, 2, 7], fov: 40 }}>
                            <ambientLight intensity={1.5} />
                            <directionalLight position={[10, 15, 10]} intensity={3} />
                            <Suspense fallback={null}>
                                {/* Enemy is currently always represented as barbarian for now */}
                                <ModelViewer modelSource={CHARACTER_TIERS[4].model} texSource={require('../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Textures/colormap.png')} scale={CHARACTER_TIERS[4].scale} position={[0, CHARACTER_TIERS[4].y, 0]} flip={true} />
                            </Suspense>
                        </Canvas>
                    </View>
                    <View style={styles.shadow} />
                </Animated.View>
            </View>

            <View style={styles.logContainer}>
                {combatLog.map((log, i) => (
                    <Text key={i} style={[styles.logText, i === 0 && styles.logTextLatest]}>
                        {log}
                    </Text>
                ))}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.attackBtn, (turn !== role || turn === 'gameover') && styles.disabledBtn]}
                    disabled={turn !== role || turn === 'gameover'}
                    onPress={() => processTurn('attack')}
                >
                    <Swords size={28} color="#fff" />
                    <Text style={styles.actionText}>{turn === role ? 'STRIKE OPPONENT' : 'WAITING FOR OP...'}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
    flashOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
    topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    closeBtn: { padding: 10 },
    title: { fontSize: 22, fontWeight: '900', color: '#f8fafc', flex: 1, textAlign: 'center', marginRight: 48 },
    hpHud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    hpSection: { flex: 1 },
    hpLabel: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
    hpBarBg: { height: 16, backgroundColor: '#1e293b', borderRadius: 8, overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: '#334155' },
    hpBarFill: { height: '100%' },
    vsBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, borderWidth: 3, borderColor: '#0f172a' },
    vsText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
    stage: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0 },
    figureContainer: { alignItems: 'center', width: '45%' },
    canvasFrame: { width: 140, height: 180 },
    shadow: { width: 80, height: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30, marginTop: -25, zIndex: -1 },
    logContainer: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, height: 120, justifyContent: 'flex-start', marginBottom: 20 },
    logText: { color: '#64748b', fontSize: 14, marginBottom: 6 },
    logTextLatest: { color: '#fbbf24', fontSize: 15, fontWeight: 'bold' },
    controls: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, marginHorizontal: 8 },
    attackBtn: { backgroundColor: '#ef4444' },
    disabledBtn: { backgroundColor: '#475569', opacity: 0.5 },
    actionText: { color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 16, letterSpacing: 1 }
});
