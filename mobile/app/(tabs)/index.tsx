import React, { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getUser, getTasks, getSocket } from '../../services/api';
import { CheckCircle2, Clock, Trophy, MapPin, QrCode, Coins, Star } from 'lucide-react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, useTexture } from '@react-three/drei/native';
import * as THREE from 'three';
import { Asset } from 'expo-asset';

function ModelViewer({ modelSource, texSource, scale = 1, position = [0, -1, 0] }: { modelSource: any, texSource?: any, scale?: number, position?: [number, number, number] }) {
  const resolvedModel = typeof modelSource === 'number' ? Asset.fromModule(modelSource).uri : modelSource;
  const resolvedTex = typeof texSource === 'number' ? Asset.fromModule(texSource).uri : texSource;

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
      const squeeze = Math.sin(time * 3) * 0.02;
      groupRef.current.scale.set(scale - squeeze, scale + squeeze, scale - squeeze);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, Math.PI / 4 + 0.2, 0]}>
      <primitive object={gltf.scene || gltf.nodes.Scene} />
    </group>
  );
}

const PET_TIERS = [
  { level: 1, name: 'Novice Cat', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-cat-emb.glb'), scale: 1.1, y: -0.6 },
  { level: 3, name: 'Hardy Dog', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-dog-emb.glb'), scale: 1.1, y: -0.6 },
  { level: 5, name: 'Swift Fox', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-fox-emb.glb'), scale: 1.1, y: -0.6 },
  { level: 7, name: 'Resilient Pig', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-pig-emb.glb'), scale: 1.1, y: -0.6 },
  { level: 10, name: 'Elite Lion', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-lion-emb.glb'), scale: 1.1, y: -0.6 },
  { level: 15, name: 'Master Dragon', model: require('../../kenney_cube-pets_1.0/Models/GLB format/animal-polar-emb.glb'), scale: 1.3, y: -0.6 },
];

const CHARACTER_TIERS = [
  { level: 1, name: 'Squire Knight', model: require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight-emb.glb'), scale: 2.3, y: -3.0 },
  { level: 5, name: 'Wild Ranger', model: require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger-emb.glb'), scale: 2.3, y: -3.0 },
  { level: 10, name: 'Arcane Mage', model: require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage-emb.glb'), scale: 2.3, y: -3.0 },
  { level: 15, name: 'Shadow Rogue', model: require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue-emb.glb'), scale: 2.3, y: -3.0 },
  { level: 20, name: 'Fierce Barbarian', model: require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian-emb.glb'), scale: 2.3, y: -3.0 },
];

export default function WorkerDashboardScreen() {
  const auth = useAuth();
  const user = auth?.user;
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      if (user?.id) {
        const [userData, tasksData] = await Promise.all([
          getUser(user.id),
          getTasks(user.id)
        ]);
        setProfile(userData);
        setTasks(tasksData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();

      const socket = getSocket();
      const handleUpdate = () => {
        loadData();
      };

      if (socket) {
        socket.on('TASK_UPDATE', handleUpdate);
      }

      return () => {
        if (socket) {
          socket.off('TASK_UPDATE', handleUpdate);
        }
      };
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const activeTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasksCount = tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length;

  const xp = profile?.xp || 0;
  const currentLevel = Math.floor(xp / 100) + 1;
  const activePet = PET_TIERS.slice().reverse().find(p => currentLevel >= p.level) || PET_TIERS[0];
  const activeChar = CHARACTER_TIERS.slice().reverse().find(c => currentLevel >= c.level) || CHARACTER_TIERS[0];

  const nextPet = PET_TIERS.find(p => p.level > currentLevel);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {profile?.fullName || user?.username}</Text>
        <Text style={styles.subtitle}>{profile?.department} Department  •  LV {currentLevel}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={styles.spinTrigger} onPress={() => router.push('/spin')}>
            <Text style={styles.spinTriggerText}>Daily Spin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.spinTrigger, { backgroundColor: '#ef4444' }]} onPress={() => router.push(('/matchmaking?gameType=arena' as any))}>
            <Text style={[styles.spinTriggerText, { color: '#fff' }]}>Enter Arena ⚔️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.spinTrigger, { backgroundColor: '#8b5cf6' }]} onPress={() => router.push(('/matchmaking?gameType=pvp-pong' as any))}>
            <Text style={[styles.spinTriggerText, { color: '#fff' }]}>Online Pong 🏓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Coins size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{profile?.coins || 0}</Text>
          <Text style={styles.statLabel}>Coins</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle2 size={24} color="#10b981" />
          <Text style={styles.statValue}>{completedTasksCount}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{profile?.rank || 'Novice'}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.companionsContainer}>
          <Text style={styles.sectionTitle}>Companions & Avatars (3D)</Text>
          <View style={styles.companionCard}>
            <View style={styles.companionRow}>
              <View style={styles.petBox}>
                <View style={styles.canvasWrapper}>
                  <Canvas>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 10, 5]} intensity={2} />
                    <Suspense fallback={null}>
                      <ModelViewer modelSource={activePet.model} texSource={require('../../kenney_cube-pets_1.0/Models/GLB format/Textures/colormap.png')} scale={activePet.scale} position={[0, activePet.y, 0]} />
                      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} autoRotate autoRotateSpeed={2} />
                    </Suspense>
                  </Canvas>
                </View>
                <Text style={styles.petName}>{activePet.name}</Text>
                <Text style={styles.petLevelLabel}>LV {activePet.level} Unlock</Text>
              </View>

              <View style={styles.avatarBox}>
                <View style={styles.canvasWrapperBig}>
                  <Canvas camera={{ position: [0, 1.2, 8], fov: 45 }}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 15, 10]} intensity={3} />
                    <Suspense fallback={null}>
                      <ModelViewer modelSource={activeChar.model} texSource={require('../../KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Textures/colormap.png')} scale={activeChar.scale} position={[0, activeChar.y, 0]} />
                      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} autoRotate autoRotateSpeed={2} />
                    </Suspense>
                  </Canvas>
                </View>
                <Text style={styles.petName}>{activeChar.name}</Text>
                <Text style={styles.petLevelLabel}>LV {activeChar.level} Unlock</Text>
              </View>
            </View>
            {nextPet ? (
              <View style={styles.nextUnlockRow}>
                <Star size={14} color="#f59e0b" />
                <Text style={styles.nextUnlockText}>Next Pet at LV {nextPet.level}</Text>
              </View>
            ) : (
              <View style={styles.nextUnlockRow}>
                <Trophy size={14} color="#10b981" />
                <Text style={[styles.nextUnlockText, { color: '#10b981' }]}>All Pets Unlocked!</Text>
              </View>
            )}
          </View>
        </View>

        {tasks.length > 0 && (
          <View style={styles.bossBattleBanner}>
            <Text style={styles.bossTitle}>🔥 ACTIVE BOSS RADE: MEGA-SERVER DOWNTIME</Text>
            <View style={styles.hpBarContainer}>
              <View style={[styles.hpBarFill, { width: '35%' }]} />
            </View>
            <Text style={styles.bossDesc}>Global raid! Finish pending tasks to deal damage! 35% HP remaining.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your Active Tasks</Text>
        {activeTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active tasks right now.</Text>
          </View>
        ) : (
          activeTasks.map((task: any) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardText}>+{task.rewardPoints} pts</Text>
                </View>
              </View>
              <Text style={styles.taskDescription}>{task.description}</Text>
              {task.location && (
                <View style={styles.locationRow}>
                  <MapPin size={16} color="#9ca3af" />
                  <Text style={styles.locationText}>{task.location}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/task/${task.id}`)}>
                <Text style={styles.actionButtonText}>View Details / Submit</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/scanner')}
      >
        <QrCode color="#fff" size={28} />
      </TouchableOpacity>
    </ScrollView>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  bossBattleBanner: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  bossTitle: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 8,
  },
  hpBarContainer: {
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  bossDesc: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spinTrigger: {
    backgroundColor: '#fbbf24',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  spinTriggerText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: '24%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  companionsContainer: {
    marginBottom: 24,
  },
  companionCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  companionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  petBox: {
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  avatarBox: {
    alignItems: 'center',
    flex: 3,
    justifyContent: 'flex-end',
  },
  canvasWrapper: {
    width: 90,
    height: 110,
    marginBottom: 4,
  },
  canvasWrapperBig: {
    width: 170,
    height: 350,
    marginBottom: -4,
  },
  petImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#38bdf8',
    overflow: 'hidden'
  },
  avatarImage: {
    width: 60,
    height: 60,
  },
  petName: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 14,
  },
  petLevelLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  nextUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  nextUnlockText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 12,
  },
  rewardBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 12,
  },
  taskDescription: {
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    color: '#9ca3af',
    marginLeft: 6,
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  }
});
