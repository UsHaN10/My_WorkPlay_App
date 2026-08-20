import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api, { getAdminStats, getTasks, getTreasury, requestMint, approveMint, rejectMint, reviewTask, getWorkers, getSkillsConfig, createTask, getSocket } from '../../services/api';
import { Users, Activity, Loader2, Coins, Check, X } from 'lucide-react-native';

export default function AdminDashboardScreen() {
    const auth = useAuth();
    const user = auth?.user;

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [treasury, setTreasury] = useState<any>(null);
    const [mintRequests, setMintRequests] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [skillsConfig, setSkillsConfig] = useState<any>(null);

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        rewardCoins: '10',
        rewardXp: '50',
        rewardSp: '0',
        timeLimitMinutes: '',
        assignedToUserId: '',
        targetRole: '',
        skillPointMap: {} as Record<string, string>
    });

    // UI States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mintAmount, setMintAmount] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        try {
            if (user?.role === 'admin') {
                const [statsData, tasksData, treasuryData, workersData, skillsData] = await Promise.all([
                    getAdminStats(),
                    getTasks(),
                    getTreasury(),
                    getWorkers(),
                    getSkillsConfig()
                ]);
                setStats(statsData);
                setTasks(tasksData);
                setTreasury(treasuryData?.treasury);
                setMintRequests(treasuryData?.mintRequests || []);
                setWorkers(workersData);
                setSkillsConfig(skillsData);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load admin stats');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();

        const socket = getSocket();
        const handleUpdate = () => {
            loadData();
        };

        if (socket) {
            socket.on('TASK_UPDATE', handleUpdate);
            socket.on('MINT_UPDATE', handleUpdate);
            socket.on('STATS_UPDATE', handleUpdate);
        }

        return () => {
            if (socket) {
                socket.off('TASK_UPDATE', handleUpdate);
                socket.off('MINT_UPDATE', handleUpdate);
                socket.off('STATS_UPDATE', handleUpdate);
            }
        };
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleTaskReview = async (taskId: number, action: 'approve' | 'reject') => {
        try {
            setActionLoading(true);
            await reviewTask(taskId, action);
            Alert.alert('Success', `Task ${action}d successfully`);
            loadData();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.rewardCoins || !newTask.rewardXp) {
            Alert.alert('Validation', 'Please provide a title, coin, and xp reward.');
            return;
        }

        try {
            setActionLoading(true);
            const taskData: any = { ...newTask };
            if (Object.keys(taskData.skillPointMap).length > 0) {
                taskData.skillCategory = JSON.stringify(taskData.skillPointMap);
                taskData.rewardSp = Object.values(taskData.skillPointMap).reduce((a: number, b: any) => a + parseInt(b || '0', 10), 0).toString();
            }
            delete taskData.skillPointMap;

            await createTask({
                ...taskData,
                rewardCoins: parseInt(taskData.rewardCoins) || 0,
                rewardXp: parseInt(taskData.rewardXp) || 0,
                rewardSp: parseInt(taskData.rewardSp) || 0,
                timeLimitMinutes: taskData.timeLimitMinutes ? parseInt(taskData.timeLimitMinutes, 10) : null
            });
            Alert.alert('Success', 'Task Created Successfully');
            setNewTask({ title: '', description: '', rewardCoins: '10', rewardXp: '50', rewardSp: '0', timeLimitMinutes: '', assignedToUserId: '', targetRole: '', skillPointMap: {} });
            loadData();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMintSubmit = async () => {
        if (!mintAmount || !paymentRef) {
            Alert.alert('Error', 'Please enter amount and payment reference');
            return;
        }
        try {
            setActionLoading(true);
            await requestMint(parseInt(mintAmount, 10), paymentRef);
            Alert.alert('Success', 'Mint request submitted for approval');
            setMintAmount('');
            setPaymentRef('');
            loadData();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMintApproval = async (requestId: number, action: 'approve' | 'reject') => {
        try {
            setActionLoading(true);
            if (action === 'approve') {
                await approveMint(requestId);
            } else {
                await rejectMint(requestId);
            }
            Alert.alert('Success', `Mint request ${action}d`);
            loadData();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const pendingApprovals = tasks.filter(t => t.status === 'pending_review');
    const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Admin Hub</Text>
                <Text style={styles.subtitle}>Welcome back, {user?.username}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Users size={24} color="#f59e0b" />
                    <Text style={styles.statValue}>{stats?.totalWorkers || 0}</Text>
                    <Text style={styles.statLabel}>Workers</Text>
                </View>
                <View style={styles.statCard}>
                    <Activity size={24} color="#10b981" />
                    <Text style={styles.statValue}>{activeTasks.length}</Text>
                    <Text style={styles.statLabel}>Active Tasks</Text>
                </View>
                <View style={styles.statCard}>
                    <Loader2 size={24} color="#3b82f6" />
                    <Text style={styles.statValue}>{pendingApprovals.length}</Text>
                    <Text style={styles.statLabel}>Pending Tasks</Text>
                </View>
            </View>

            {/* Create Task Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Create New Task</Text>
                <View style={styles.treasuryCard}>
                    <Text style={styles.label}>Task Title *</Text>
                    <TextInput style={styles.input} value={newTask.title} onChangeText={t => setNewTask({ ...newTask, title: t })} placeholder="e.g. Clean the storage room" placeholderTextColor="#64748b" />

                    <Text style={[styles.label, { marginTop: 12 }]}>Description</Text>
                    <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} value={newTask.description} onChangeText={t => setNewTask({ ...newTask, description: t })} placeholder="..." placeholderTextColor="#64748b" multiline />

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Coins *</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={newTask.rewardCoins} onChangeText={t => setNewTask({ ...newTask, rewardCoins: t })} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>XP *</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={newTask.rewardXp} onChangeText={t => setNewTask({ ...newTask, rewardXp: t })} />
                        </View>
                    </View>

                    <Text style={[styles.label, { marginTop: 12 }]}>Time Limit (Minutes, Optional)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={newTask.timeLimitMinutes} onChangeText={t => setNewTask({ ...newTask, timeLimitMinutes: t })} placeholder="e.g. 30" placeholderTextColor="#64748b" />

                    <Text style={[styles.label, { marginTop: 16 }]}>Assign Worker (Private Task)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                        <TouchableOpacity style={[styles.roleButton, !newTask.assignedToUserId && styles.roleButtonActive]} onPress={() => setNewTask({ ...newTask, assignedToUserId: '', targetRole: '' })}>
                            <Text style={[styles.roleText, !newTask.assignedToUserId && styles.roleTextActive]}>Global / None</Text>
                        </TouchableOpacity>
                        {workers.map(w => (
                            <TouchableOpacity key={w.id} style={[styles.roleButton, newTask.assignedToUserId === w.id.toString() && styles.roleButtonActive]} onPress={() => setNewTask({ ...newTask, assignedToUserId: w.id.toString(), targetRole: '' })}>
                                <Text style={[styles.roleText, newTask.assignedToUserId === w.id.toString() && styles.roleTextActive]}>{w.username}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {!newTask.assignedToUserId && skillsConfig && (
                        <>
                            <Text style={[styles.label, { marginTop: 16 }]}>Target Job Role (Global Task Only)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                                <TouchableOpacity style={[styles.roleButton, !newTask.targetRole && styles.roleButtonActive]} onPress={() => setNewTask({ ...newTask, targetRole: '', skillPointMap: {} })}>
                                    <Text style={[styles.roleText, !newTask.targetRole && styles.roleTextActive]}>Any Role</Text>
                                </TouchableOpacity>
                                {skillsConfig.jobRoles.map((role: string) => (
                                    <TouchableOpacity key={role} style={[styles.roleButton, newTask.targetRole === role && styles.roleButtonActive]} onPress={() => setNewTask({ ...newTask, targetRole: role, skillPointMap: {} })}>
                                        <Text style={[styles.roleText, newTask.targetRole === role && styles.roleTextActive]}>{role}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    {/* Skill Graph Viewer if assignedToUserId */}
                    {!!newTask.assignedToUserId && (() => {
                        const targetWorker = workers.find(w => w.id.toString() === newTask.assignedToUserId);
                        if (!targetWorker || !targetWorker.jobRole) return <Text style={{ color: '#ef4444', marginTop: 12, fontSize: 12 }}>Worker has no job role defined</Text>;

                        const wRole = targetWorker.jobRole;
                        const wSkills = targetWorker.skillLevels || {};
                        let flatten: string[] = [];
                        if (skillsConfig?.skillTrees[wRole]) {
                            Object.values(skillsConfig.skillTrees[wRole]).forEach((sArr: any) => { flatten = [...flatten, ...sArr]; });
                        }

                        return (
                            <View style={{ marginTop: 16, backgroundColor: '#0f172a', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155' }}>
                                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>{targetWorker.username}'s Real-time Skill Graph</Text>
                                {flatten.map(skill => {
                                    const lvl = wSkills[skill] || 0;
                                    const pct = Math.min((lvl / 100) * 100, 100);
                                    return (
                                        <View key={skill} style={{ marginBottom: 6 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <Text style={{ color: '#cbd5e1', fontSize: 10 }}>{skill}</Text>
                                                <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}>{lvl} SP</Text>
                                            </View>
                                            <View style={{ height: 4, backgroundColor: '#1e293b', borderRadius: 2 }}>
                                                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#3b82f6', borderRadius: 2 }} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })()}

                    {/* Target Skill Category (Uses role of worker if user picked, else uses targetRole directly) */}
                    {(() => {
                        let activeRole = newTask.targetRole;
                        if (newTask.assignedToUserId) {
                            const w = workers.find(x => x.id.toString() === newTask.assignedToUserId);
                            activeRole = w ? w.jobRole : '';
                        }
                        if (activeRole && skillsConfig?.skillTrees[activeRole]) {
                            let availableSkills: string[] = [];
                            Object.values(skillsConfig.skillTrees[activeRole]).forEach((arr: any) => availableSkills = [...availableSkills, ...arr]);

                            const smap = newTask.skillPointMap || {};
                            const toggleCat = (cat: string) => {
                                const newMap = { ...smap };
                                if (newMap[cat] !== undefined) {
                                    delete newMap[cat];
                                } else {
                                    newMap[cat] = '5';
                                }
                                setNewTask({ ...newTask, skillPointMap: newMap });
                            };
                            const updateSp = (cat: string, val: string) => {
                                setNewTask({ ...newTask, skillPointMap: { ...smap, [cat]: val } });
                            };

                            return (
                                <>
                                    <Text style={[styles.label, { marginTop: 16 }]}>Target Skill SP Rewards (Multi-select)</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                                        {availableSkills.map((sk: string) => {
                                            const isSelected = smap[sk] !== undefined;
                                            return (
                                                <View key={sk} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, backgroundColor: isSelected ? '#eef2ff' : '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: isSelected ? '#a5b4fc' : '#e2e8f0', overflow: 'hidden' }}>
                                                    <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => toggleCat(sk)}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#4f46e5' : '#64748b' }}>{sk}</Text>
                                                    </TouchableOpacity>
                                                    {isSelected && (
                                                        <TextInput
                                                            keyboardType="numeric"
                                                            value={smap[sk]}
                                                            onChangeText={(t) => updateSp(sk, t)}
                                                            style={{ width: 40, height: 32, backgroundColor: '#ffffff', textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#4338ca', borderLeftWidth: 1, borderLeftColor: '#c7d2fe' }}
                                                        />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </>
                            );
                        }
                        return null;
                    })()}

                    <TouchableOpacity style={[styles.mintBtn, { marginTop: 16 }]} onPress={handleCreateTask} disabled={actionLoading}>
                        <Text style={styles.mintBtnText}>+ Create Task</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Treasury Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Treasury Management</Text>

                <View style={styles.treasuryCard}>
                    <View style={styles.treasuryHeader}>
                        <Coins size={32} color="#f59e0b" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.treasuryLabel}>Total Balance</Text>
                            <Text style={styles.treasuryBalance}>{treasury?.balance || 0} WPC</Text>
                        </View>
                    </View>

                    <Text style={styles.mintTitle}>Request Minting</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Amount..."
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={mintAmount}
                            onChangeText={setMintAmount}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1.5, marginRight: 8 }]}
                            placeholder="Bank Ref..."
                            placeholderTextColor="#64748b"
                            value={paymentRef}
                            onChangeText={setPaymentRef}
                        />
                        <TouchableOpacity style={styles.mintBtn} onPress={handleMintSubmit} disabled={actionLoading}>
                            <Text style={styles.mintBtnText}>Mint</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mint Requests */}
                {mintRequests.filter(r => r.status === 'pending').length > 0 && (
                    <View style={{ marginTop: 16 }}>
                        <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Pending Mint Requests</Text>
                        {mintRequests.filter(r => r.status === 'pending').map(req => (
                            <View key={req.id} style={styles.taskCard}>
                                <Text style={styles.taskTitle}>Mint {req.amount} WPC</Text>
                                <Text style={styles.taskDescription}>Ref: {req.paymentReference} | By: {req.requester?.username}</Text>
                                <Text style={{ color: '#dbeafe', fontSize: 12, marginBottom: 12 }}>Approvals: {req.approvalsCount}/2</Text>

                                {req.requesterId !== user?.id ? (
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { flex: 1, marginRight: 8, backgroundColor: '#10b981' }]}
                                            onPress={() => handleMintApproval(req.id, 'approve')}
                                            disabled={actionLoading}
                                        >
                                            <Check size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { flex: 1, backgroundColor: '#ef4444' }]}
                                            onPress={() => handleMintApproval(req.id, 'reject')}
                                            disabled={actionLoading}
                                        >
                                            <X size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>Waiting for other admins to approve...</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Task Approvals */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Approvals</Text>
                {pendingApprovals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No tasks pending approval.</Text>
                    </View>
                ) : (
                    pendingApprovals.map(task => (
                        <View key={task.id} style={styles.taskCard}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <View style={styles.rewardBadge}>
                                    <Text style={styles.rewardText}>{task.rewardCoins} WPC</Text>
                                </View>
                            </View>
                            <Text style={styles.taskDescription}>{task.description}</Text>
                            {task.workerComment && (
                                <Text style={{ color: '#cbd5e1', marginBottom: 12, fontStyle: 'italic' }}>"{task.workerComment}"</Text>
                            )}

                            {task.verificationPhoto && (
                                <Image
                                    source={{ uri: `${api.defaults.baseURL?.replace('/api', '')}${task.verificationPhoto}` }}
                                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16, backgroundColor: '#0f172a' }}
                                    resizeMode="cover"
                                />
                            )}

                            {task.skillCategory && (() => {
                                try {
                                    const parsed = task.skillCategory.startsWith('{') ? JSON.parse(task.skillCategory) : null;
                                    if (parsed) {
                                        return (
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 }}>
                                                {Object.entries(parsed).map(([skill, sp]) => (
                                                    <View key={skill} style={{ backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
                                                        <Text style={{ color: '#a78bfa', fontSize: 11, fontWeight: 'bold' }}>{skill} <Text style={{ color: '#fff' }}>+{String(sp)} SP</Text></Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    }
                                    return <Text style={{ color: '#64748b', fontSize: 10, marginBottom: 16, fontWeight: 'bold' }}>{task.skillCategory}</Text>;
                                } catch (e) {
                                    return <Text style={{ color: '#64748b', fontSize: 10, marginBottom: 16, fontWeight: 'bold' }}>{task.skillCategory}</Text>;
                                }
                            })()}

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { flex: 1, marginRight: 8, backgroundColor: '#10b981' }]}
                                    onPress={() => handleTaskReview(task.id, 'approve')}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { flex: 1, backgroundColor: '#ef4444' }]}
                                    onPress={() => handleTaskReview(task.id, 'reject')}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* All Active Created Tasks */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active / Created Tasks</Text>
                {activeTasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No active tasks right now.</Text>
                    </View>
                ) : (
                    activeTasks.map(task => (
                        <View key={task.id} style={styles.taskCard}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <View style={[styles.rewardBadge, { backgroundColor: '#dbeafe' }]}>
                                    <Text style={[styles.rewardText, { color: '#2563eb' }]}>{task.status.toUpperCase().replace('_', ' ')}</Text>
                                </View>
                            </View>
                            <Text style={styles.taskDescription}>{task.description}</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Reward: {task.rewardCoins} WPC | {task.rewardXp} XP</Text>
                                {task.assignedToUserId ? (
                                    <Text style={{ color: '#10b981', fontSize: 12 }}>Assigned to: Worker #{task.assignedToUserId}</Text>
                                ) : (
                                    <Text style={{ color: '#f59e0b', fontSize: 12 }}>Global Task</Text>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={{ height: 40 }} />
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
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: '31%',
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
    treasuryCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    treasuryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 16,
    },
    treasuryLabel: {
        color: '#9ca3af',
        fontSize: 14,
    },
    treasuryBalance: {
        color: '#f59e0b',
        fontSize: 28,
        fontWeight: 'bold',
    },
    mintTitle: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#334155',
    },
    mintBtn: {
        backgroundColor: '#f59e0b',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
    },
    mintBtnText: {
        color: '#0f172a',
        fontWeight: 'bold',
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
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rewardText: {
        color: '#d97706',
        fontWeight: 'bold',
        fontSize: 12,
    },
    taskDescription: {
        color: '#cbd5e1',
        lineHeight: 22,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 6,
    },
    label: {
        color: '#e2e8f0',
        marginBottom: 4,
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    roleButton: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginRight: 8,
    },
    roleButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    roleText: {
        color: '#9ca3af',
        fontWeight: '600',
        fontSize: 12,
    },
    roleTextActive: {
        color: '#ffffff',
    },
});
