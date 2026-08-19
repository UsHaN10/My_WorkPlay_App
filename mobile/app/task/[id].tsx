import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, Vibration, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, CheckCircle, X, Send, Clock, PlayCircle } from 'lucide-react-native';
import { schedulePushNotification } from '../../services/notifications';

import { getTaskById, submitTask, startTask } from '../../services/api';

export default function TaskDetailModal() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showVictory, setShowVictory] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const [comments, setComments] = useState([{ id: 1, user: 'Admin', text: 'Please ensure you check the gears properly.', time: '10:00 AM' }]);
    const [newComment, setNewComment] = useState('');
    const [starting, setStarting] = useState(false);
    const [timeLeftStr, setTimeLeftStr] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        getTaskById(id as string).then(data => {
            setTask(data);
            setLoading(false);
        }).catch(err => {
            Alert.alert('Error', 'Failed to load task details');
            router.back();
        });
    }, [id]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (task && task.status === 'in_progress' && task.timeLimitMinutes && task.startedAt) {
            const timeLimitMs = task.timeLimitMinutes * 60 * 1000;
            const startTime = new Date(task.startedAt).getTime();

            // Execute immediately once
            const tick = () => {
                const elapsed = Date.now() - startTime;
                const remaining = timeLimitMs - elapsed;

                if (remaining <= 0) {
                    setTimeLeftStr('00:00');
                    setIsExpired(true);
                    clearInterval(interval);
                } else {
                    const mins = Math.floor(remaining / 60000);
                    const secs = Math.floor((remaining % 60000) / 1000);
                    setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
                }
            };
            tick();
            interval = setInterval(tick, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        }
    }, [task]);

    const handleStartTask = async () => {
        setStarting(true);
        try {
            const updated = await startTask(task.id);
            setTask(updated.task || updated);
            setStarting(false);
        } catch (err: any) {
            setStarting(false);
            Alert.alert('Error', err.message || 'Failed to start task');
        }
    };

    const openCamera = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Refused", "You've refused to allow this app to access your camera!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Proof Required', 'Please take a photo of your completed work before submitting.');
            return;
        }

        setSubmitting(true);
        Vibration.vibrate([0, 50, 100, 50]); // RPG level-up style multiple haptics!

        try {
            const formData = new FormData();
            formData.append('workerComment', 'Submitted from mobile app');

            const filename = imageUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            let typeStr = match ? `image/${match[1]}` : `image`;
            if (typeStr === 'image/jpg') typeStr = 'image/jpeg';

            formData.append('verificationPhoto', { uri: imageUri, name: filename, type: typeStr } as any);

            await submitTask(task.id, formData);

            setTimeout(() => {
                schedulePushNotification("Task Submitted!", "Your proof of work has been sent to an administrator for review.");
                setSubmitting(false);

                // Show addictive Victory Screen
                setShowVictory(true);
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 50,
                    useNativeDriver: true,
                }).start();

                // Close after 3 seconds
                setTimeout(() => {
                    router.back();
                }, 3000);
            }, 1000);
        } catch (err: any) {
            setSubmitting(false);
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to submit the task.');
        }
    };

    if (loading || !task) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Task Details</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <X size={24} color="#f8fafc" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.title}>{task.title}</Text>
                <View style={styles.badgesGroup}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{task.rewardCoins} WPC</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#eef2ff' }]}>
                        <Text style={[styles.badgeText, { color: '#4f46e5' }]}>{task.rewardXp} XP</Text>
                    </View>

                    {task.skillCategory && (() => {
                        try {
                            const parsed = task.skillCategory.startsWith('{') ? JSON.parse(task.skillCategory) : null;
                            if (parsed) {
                                return Object.entries(parsed).map(([skill, sp]) => (
                                    <View key={skill} style={[styles.badge, { backgroundColor: '#fdf4ff' }]}>
                                        <Text style={[styles.badgeText, { color: '#c026d3' }]}>{skill} +{String(sp)} SP</Text>
                                    </View>
                                ));
                            }
                            return (
                                <View style={[styles.badge, { backgroundColor: '#fdf4ff' }]}>
                                    <Text style={[styles.badgeText, { color: '#c026d3' }]}>{task.skillCategory}</Text>
                                </View>
                            );
                        } catch (e) {
                            return null;
                        }
                    })()}

                    <View style={[styles.badge, { backgroundColor: '#3f6212', marginLeft: 'auto' }]}>
                        <Text style={[styles.badgeText, { color: '#ecfccb' }]}>{task.status.toUpperCase()}</Text>
                    </View>
                </View>

                {timeLeftStr && task.status === 'in_progress' && (
                    <View style={[styles.timerContainer, isExpired && { backgroundColor: '#7f1d1d' }]}>
                        <Clock size={20} color={isExpired ? "#fca5a5" : "#fcd34d"} />
                        <Text style={[styles.timerText, isExpired && { color: "#fca5a5" }]}>
                            {isExpired ? "Time Expired" : `Time Remaining: ${timeLeftStr}`}
                        </Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{task.description}</Text>

                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.locationRow}>
                    <MapPin size={20} color="#9ca3af" />
                    <Text style={styles.locationText}>{task.location}</Text>
                </View>

                {/* Map View */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: task.lat || 6.9271,
                            longitude: task.lng || 79.8612,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                    >
                        {task.lat && <Marker coordinate={{ latitude: task.lat, longitude: task.lng }} title={task.title} />}
                    </MapView>
                </View>

                {task.status !== 'pending' && (
                    <>
                        <Text style={styles.sectionTitle}>Proof of Work</Text>
                        <Text style={styles.helperText}>A photo is required to submit this task for review.</Text>

                        {imageUri ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                <TouchableOpacity style={styles.retakeButton} onPress={openCamera}>
                                    <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                    <Text style={styles.btnText}>Retake Photo</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
                                <Camera size={24} color="#ffffff" style={{ marginBottom: 8 }} />
                                <Text style={styles.btnText}>Open Camera</Text>
                            </TouchableOpacity>
                        )}

                        {/* Chat / Comments */}
                        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Activity & Comments</Text>
                        <View style={styles.chatContainer}>
                            {comments.map((comment) => (
                                <View key={comment.id} style={styles.commentBubble}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentUser}>{comment.user}</Text>
                                        <Text style={styles.commentTime}>{comment.time}</Text>
                                    </View>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                </View>
                            ))}
                            <View style={styles.chatInputContainer}>
                                <TextInput
                                    style={styles.chatInput}
                                    placeholder="Ask a question..."
                                    placeholderTextColor="#9ca3af"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                />
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={() => {
                                        if (newComment) {
                                            setComments([...comments, { id: Date.now(), user: 'You', text: newComment, time: 'Now' }]);
                                            setNewComment('');
                                        }
                                    }}
                                >
                                    <Send size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                {task.status === 'pending' ? (
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: '#10b981' }, starting && { opacity: 0.5 }]}
                        onPress={handleStartTask}
                        disabled={starting}
                    >
                        {starting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <PlayCircle size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>Start Task</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, (!imageUri || submitting || isExpired) && { opacity: 0.5 }]}
                        onPress={handleSubmit}
                        disabled={!imageUri || submitting || isExpired}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <CheckCircle size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>{isExpired ? "Time Expired" : "Submit Task"}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Victory Overlay Screen */}
            {showVictory && (
                <View style={styles.victoryOverlay}>
                    <Animated.View style={[styles.victoryBox, { transform: [{ scale: scaleAnim }] }]}>
                        <CheckCircle size={80} color="#fbbf24" />
                        <Text style={styles.victoryTitle}>VICTORY!</Text>
                        <Text style={styles.victoryPoints}>+{task.rewardPoints} XP</Text>
                        <Text style={styles.victorySubtext}>Task successful. Rewards sent to treasury!</Text>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    timerContainer: {
        backgroundColor: '#78350f',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        marginTop: 8,
    },
    timerText: {
        color: '#fcd34d',
        fontWeight: '900',
        fontSize: 18,
        marginLeft: 10,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#334155',
        borderRadius: 20,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 12,
    },
    badgesGroup: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    badge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
    },
    badgeText: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 12,
        marginTop: 8,
    },
    description: {
        color: '#cbd5e1',
        lineHeight: 24,
        fontSize: 16,
        marginBottom: 24,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        color: '#9ca3af',
        marginLeft: 8,
        fontSize: 15,
    },
    mapContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    helperText: {
        color: '#9ca3af',
        marginBottom: 16,
    },
    cameraButton: {
        backgroundColor: '#334155',
        borderWidth: 2,
        borderColor: '#475569',
        borderStyle: 'dashed',
        borderRadius: 16,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreviewContainer: {
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        marginBottom: 12,
    },
    retakeButton: {
        backgroundColor: '#475569',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    btnText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: '#1e293b',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    submitBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    chatContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    commentBubble: {
        backgroundColor: '#334155',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    commentUser: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentTime: {
        color: '#9ca3af',
        fontSize: 12,
    },
    commentText: {
        color: '#f8fafc',
        lineHeight: 20,
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#f8fafc',
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: '#3b82f6',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    victoryOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    victoryBox: {
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 40,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
    },
    victoryTitle: {
        color: '#fbbf24',
        fontSize: 48,
        fontWeight: '900',
        marginTop: 20,
        textShadowColor: 'rgba(251, 191, 36, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    victoryPoints: {
        color: '#10b981',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 10,
    },
    victorySubtext: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 10,
    }
});
