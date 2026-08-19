import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Activity, Beaker, Zap, Wrench, CheckCircle, ChevronDown, Award } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getUser, getSkillsConfig } from '../../services/api';

export default function SkillsScreen() {
    const { user, profile } = useAuth() || {};
    const [liveProfile, setLiveProfile] = useState<any>(null);
    const [skillsConfig, setSkillsConfig] = useState<any>(null);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    useEffect(() => {
        if (user?.id) {
            getUser(user.id).then(data => setLiveProfile(data)).catch(() => { });
            getSkillsConfig().then(data => {
                setSkillsConfig(data);
                // Expand all by default
                if (data && data.skillTrees && user?.jobRole && data.skillTrees[user.jobRole]) {
                    setExpandedCats(Object.keys(data.skillTrees[user.jobRole]));
                }
            }).catch(() => { });
        }
    }, [user]);

    const xp = liveProfile?.xp ?? profile?.xp ?? user?.xp ?? 0;

    // Calculate a dynamic level based on XP (every 100 XP is a level up)
    const level = Math.floor(xp / 100) + 1;

    const toggleCat = (cat: string) => {
        setExpandedCats(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>LV {level}</Text>
                </View>
                <View>
                    <Text style={styles.title}>{liveProfile?.jobRole ? liveProfile.jobRole : 'Skill Tree'}</Text>
                    <Text style={styles.spText}>Task Progression</Text>
                </View>
            </View>

            <Text style={styles.metaDesc}>
                Completing Daily and Extra Tasks assigned to your specific job role automatically grants Skill Points (SP) in the respective categories!
            </Text>

            <View style={styles.treeContainer}>
                {!skillsConfig || !liveProfile?.jobRole || !skillsConfig.skillTrees[liveProfile.jobRole] ? (
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>
                        {!liveProfile?.jobRole ? "You must set a Job Role in your profile." : "Loading Skill Tree..."}
                    </Text>
                ) : (
                    Object.entries(skillsConfig.skillTrees[liveProfile.jobRole]).map(([categoryName, skillsArr]: any) => {
                        const isExpanded = expandedCats.includes(categoryName);
                        return (
                            <View key={categoryName} style={styles.categoryBlock}>
                                <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCat(categoryName)}>
                                    <View style={styles.catHeaderLeft}>
                                        <Wrench color="#38bdf8" size={20} />
                                        <Text style={styles.categoryTitle}>{categoryName}</Text>
                                    </View>
                                    <View style={isExpanded ? { transform: [{ rotate: '180deg' }] } : {}}>
                                        <ChevronDown color="#94a3b8" size={20} />
                                    </View>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.skillsList}>
                                        {skillsArr.map((skillName: string) => {
                                            const spLevel = (liveProfile.skillLevels && liveProfile.skillLevels[skillName]) ? liveProfile.skillLevels[skillName] : 0;
                                            const maxLvl = 100;
                                            const pct = Math.min((spLevel / maxLvl) * 100, 100);

                                            return (
                                                <View key={skillName} style={styles.skillRow}>
                                                    <View style={styles.skillHeaderRow}>
                                                        <Text style={styles.skillName}>{skillName}</Text>
                                                        <View style={styles.spBadge}>
                                                            <Award size={12} color="#f59e0b" />
                                                            <Text style={styles.spBadgeText}>{spLevel} SP</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.progressBarBg}>
                                                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
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
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    levelBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#0f172a',
    },
    levelText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 18,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    spText: {
        fontSize: 16,
        color: '#38bdf8',
        fontWeight: '600',
        marginTop: 4,
    },
    metaDesc: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginHorizontal: 30,
        marginTop: 20,
        marginBottom: 10,
        lineHeight: 20,
    },
    treeContainer: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 30,
    },
    categoryBlock: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#0f172a50',
    },
    catHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skillsList: {
        padding: 16,
        paddingTop: 8,
    },
    skillRow: {
        marginBottom: 16,
    },
    skillHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    skillName: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600',
    },
    spBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f59e0b20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    spBadgeText: {
        color: '#f59e0b',
        fontWeight: 'bold',
        fontSize: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#0f172a',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 3,
    }
});
