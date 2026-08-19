import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { workerLogin, adminLogin } from '../services/api';

export default function LoginScreen() {
    const [isWorker, setIsWorker] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password.');
            return;
        }

        setLoading(true);
        try {
            let data;
            if (isWorker) {
                data = await workerLogin(username, password);
            } else {
                data = await adminLogin(username, password);
            }

            const { token, user } = data;
            await login(user, token);

            // auth context will automatically redirect based on user state
        } catch (error) {
            const msg = error.response?.data?.error || 'Login failed. Please try again.';
            Alert.alert('Login Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>WorkPlay</Text>
                    <Text style={styles.subtitle}>Welcome back! Please login to your account.</Text>
                </View>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, isWorker && styles.toggleActive]}
                        onPress={() => setIsWorker(true)}
                    >
                        <Text style={[styles.toggleText, isWorker && styles.toggleTextActive]}>Worker Portal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, !isWorker && styles.toggleActive]}
                        onPress={() => setIsWorker(false)}
                    >
                        <Text style={[styles.toggleText, !isWorker && styles.toggleTextActive]}>Admin Portal</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        placeholderTextColor="#9ca3af"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signupContainer}
                    onPress={() => router.push('/signup')}
                >
                    <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text></Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    title: {
        fontSize: 42,
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
        paddingVertical: 12,
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
        padding: 16,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: '#334155',
    },
    loginButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    signupText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    signupTextBold: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
});
