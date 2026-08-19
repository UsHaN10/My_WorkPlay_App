declare module '*.js' {
    const value: any;
    export default value;
    export * from '*.js';
}

declare module '*/services/api' {
    const getAdminStats: any;
    const getTasks: any;
    const getTreasury: any;
    const requestMint: any;
    const approveMint: any;
    const rejectMint: any;
    const reviewTask: any;
    const getWorkers: any;
    const getSkillsConfig: any;
    const createTask: any;
    const getSocket: any;
    const getTaskById: any;
    const submitTask: any;
    const api: any;
    export { getAdminStats, getTasks, getTreasury, requestMint, approveMint, rejectMint, reviewTask, getWorkers, getSkillsConfig, createTask, getSocket, getTaskById, submitTask };
    export default api;
}

declare module '*/context/AuthContext' {
    const useAuth: any;
    const AuthProvider: any;
    export { useAuth, AuthProvider };
}

declare module '*/services/notifications' {
    const schedulePushNotification: any;
    export { schedulePushNotification };
}

// React 19 + React Native type extension for `key` prop on components mapped in iterators
import * as React from 'react';
import { ViewProps } from 'react-native';

declare module 'react-native' {
    interface ViewProps {
        key?: React.Key | null;
    }
    interface TextProps {
        key?: React.Key | null;
    }
    interface TouchableOpacityProps {
        key?: React.Key | null;
    }
}
