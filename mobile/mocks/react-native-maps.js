import React from 'react';
import { View, Text } from 'react-native';

const MapView = ({ children, style, ...props }) => (
    <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' }]}>
        <Text style={{ color: '#64748b' }}>Map view not available on web</Text>
        {children}
    </View>
);

export const Marker = ({ title, description }) => null;

export default MapView;
