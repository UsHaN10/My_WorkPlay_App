import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, QrCode } from 'lucide-react-native';

export default function QRScannerModal() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const router = useRouter();

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.center}><Text style={styles.text}>Requesting camera permission...</Text></View>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.center}>
                <Text style={styles.text}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { marginTop: 10, backgroundColor: '#ef4444' }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        // Assuming QR Code data holds a Task ID like "TASK-123"
        Alert.alert(
            "QR Code Detected",
            `Scanned Task ID: ${data}`,
            [
                { text: "Dismiss", onPress: () => setScanned(false), style: "cancel" },
                {
                    text: "Open Task",
                    onPress: () => {
                        router.back();
                        setTimeout(() => {
                            router.push(`/task/${data}` as any);
                        }, 300);
                    }
                }
            ]
        );
    };



    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Scan Task QR</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <X size={24} color="#f8fafc" />
                </TouchableOpacity>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.cameraBox}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />
                <View style={styles.overlay}>
                    <QrCode size={200} color="rgba(255,255,255,0.3)" />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Point your camera at a machinery or location QR code to pull up the associated task details instantly.
                </Text>
                {scanned && (
                    <TouchableOpacity
                        style={styles.scanAgainButton}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    text: {
        color: '#f8fafc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
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
    },
    title: {
        color: '#f8fafc',
        fontSize: 24,
        fontWeight: 'bold'
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#1e293b',
        borderRadius: 20,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
        margin: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cameraBox: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    scanAgainButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    scanAgainText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
