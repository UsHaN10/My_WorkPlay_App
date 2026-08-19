import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';

export default function SignupScreen() {
    const [isWorker, setIsWorker] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [department, setDepartment] = useState('');
    const [jobRole, setJobRole] = useState('Sewing Machine Operator');
    const [loading, setLoading] = useState(false);

    const JOB_ROLES = ['Sewing Machine Operator', 'Line Leader', 'Production Supervisor', 'Production Manager'];
    const { login } = useAuth();
    const router = useRouter();

    const handleSignup = async () => {
        if (!username || !password || !email || !fullName) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const role = isWorker ? 'worker' : 'admin';
            const finalDept = isWorker ? 'Production Department' : department;
            const finalJobRole = isWorker ? jobRole : null;

            const response = await register(username, password, role, fullName, email, finalDept, finalJobRole);

            Alert.alert('Success', 'Account created successfully! Please log in.', [
                { text: 'OK', onPress: () => router.push('/login') }
            ]);
        } catch (error) {
            const msg = error.response?.data?.error || 'Registration failed. Please try again.';
            Alert.alert('Signup Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.headerContainer}>
                    <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join WorkPlay today.</Text>
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, isWorker && styles.toggleActive]}
                        onPress={() => setIsWorker(true)}
                    >
                        <Text style={[styles.toggleText, isWorker && styles.toggleTextActive]}>Worker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, !isWorker && styles.toggleActive]}
                        onPress={() => setIsWorker(false)}
                    >
                        <Text style={[styles.toggleText, !isWorker && styles.toggleTextActive]}>Admin</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#9ca3af"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Username *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Choose a username"
                        placeholderTextColor="#9ca3af"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Department *</Text>
                    <View style={[styles.input, { backgroundColor: '#334155', borderColor: '#475569' }]}>
                        <Text style={{ color: '#cbd5e1' }}>Production Department</Text>
                    </View>
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                        Only the Production Department is currently accessible.
                    </Text>
                </View>

                {isWorker && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Job Role *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                            {JOB_ROLES.map(role => (
                                <TouchableOpacity
                                    key={role}
                                    style={[styles.roleButton, jobRole === role && styles.roleButtonActive]}
                                    onPress={() => setJobRole(role)}
                                >
                                    <Text style={[styles.roleText, jobRole === role && styles.roleTextActive]}>{role}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.signupButton}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.signupButtonText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginContainer}
                    onPress={() => router.back()}
                >
                    <Text style={styles.loginText}>Already have an account? <Text style={styles.loginTextBold}>Sign In</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleActive: {
        backgroundColor: '#3b82f6',
    },
    toggleText: {
        color: '#9ca3af',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#ffffff',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        color: '#e2e8f0',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 14,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: '#334155',
    },
    signupButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    signupButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    loginTextBold: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    roleButton: {
        backgroundColor: '#1e293b',
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
        fontSize: 14,
    },
    roleTextActive: {
        color: '#ffffff',
    },
});
