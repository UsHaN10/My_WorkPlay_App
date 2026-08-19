import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";

const getBaseURL = () => {
    // Top priority: Vercel/Production Environment Variable
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    // Mobile dev priority: Expo host URI
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(":")[0];
        return `http://${ip}:5000/api`;
    }
    // Fallback for emulator (Android)
    return "http://10.0.2.2:5000/api";
};

const api = axios.create({
    baseURL: getBaseURL(),
});

let socket = null;

export const initSocket = () => {
    if (!socket) {
        // Drop the \`/api\` from the baseURL to get the true server host
        const socketUrl = getBaseURL().replace('/api', '');
        socket = io(socketUrl, {
            transports: ['websocket']
        });
        socket.on('connect', () => {
            console.log('Connected to WebSocket server:', socket.id);
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

// Request interceptor to attach token
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.error("Error retrieving token:", err);
    }
    return config;
});

// Response interceptor for Offline Caching
api.interceptors.response.use(
    (response) => {
        if (response.config.method === 'get') {
            const url = response.config.url + (response.config.params ? JSON.stringify(response.config.params) : '');
            AsyncStorage.setItem(`@cache_${url}`, JSON.stringify(response.data)).catch(() => { });
        }
        return response;
    },
    async (error) => {
        if (!error.response && error.config && error.config.method === 'get') {
            // Network fallback
            const url = error.config.url + (error.config.params ? JSON.stringify(error.config.params) : '');
            try {
                const cachedData = await AsyncStorage.getItem(`@cache_${url}`);
                if (cachedData) {
                    return Promise.resolve({ data: JSON.parse(cachedData), status: 200, fromCache: true });
                }
            } catch (e) {
                console.error('Cache retrieval failed');
            }
        }
        return Promise.reject(error);
    }
);

export const workerLogin = async (username, password) => {
    const res = await api.post("/auth/login", {
        username,
        password,
        role: "worker",
    });
    return res.data;
};

export const adminLogin = async (username, password) => {
    const res = await api.post("/auth/login", {
        username,
        password,
        role: "admin",
    });
    return res.data;
};

export const register = async (
    username,
    password,
    role,
    fullName,
    email,
    department,
    jobRole
) => {
    const res = await api.post("/auth/register", {
        username,
        password,
        role,
        fullName,
        email,
        department,
        jobRole,
    });
    return res.data;
};

export const getTasks = async (userId) => {
    const res = await api.get("/tasks", { params: { userId } });
    return res.data;
};

export const getTaskById = async (taskId) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data;
};

export const createTask = async (taskData) => {
    const res = await api.post("/tasks", taskData);
    return res.data;
};

export const completeTask = async (taskId, userId) => {
    const res = await api.post(`/tasks/${taskId}/complete`, { userId });
    return res.data;
};

export const startTask = async (taskId) => {
    const res = await api.post(`/tasks/${taskId}/start`);
    return res.data;
};

export const submitTask = async (taskId, formData) => {
    // Explicitly use Native fetch() on Android. Axios XHR multipart mapping crashes unexpectedly with Hermers/JSC!
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${getBaseURL()}/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    if (!response.ok) {
        let errorMsg = 'Failed to submit task';
        try {
            const errRes = await response.json();
            errorMsg = errRes.error || errorMsg;
        } catch (e) { }
        throw new Error(errorMsg);
    }
    return await response.json();
};

export const getLeaderboard = async () => {
    const res = await api.get("/leaderboard");
    return res.data;
};

export const getUser = async (id) => {
    const res = await api.get(`/user/${id}`);
    return res.data;
};

export const getTransactions = async (userId) => {
    const res = await api.get(`/transactions/${userId}`);
    return res.data;
};

export const getAdminStats = async () => {
    const res = await api.get("/admin/stats");
    return res.data;
};

export const getTreasury = async () => {
    const res = await api.get('/admin/treasury');
    return res.data;
};

export const requestMint = async (amount, paymentReference) => {
    const res = await api.post('/admin/mint', { amount, paymentReference });
    return res.data;
};

export const approveMint = async (requestId) => {
    const res = await api.post(`/admin/mint-requests/${requestId}/approve`);
    return res.data;
};

export const rejectMint = async (requestId) => {
    const res = await api.post(`/admin/mint-requests/${requestId}/reject`);
    return res.data;
};

export const reviewTask = async (taskId, action, adminComment = '') => {
    const res = await api.post(`/tasks/${taskId}/review`, { action, adminComment });
    return res.data;
};

export const claimArenaWin = async () => {
    const res = await api.post('/tasks/arena-win');
    return res.data;
};

export const getSkillsConfig = async () => {
    const res = await api.get('/skills/config');
    return res.data;
};

export const getWorkers = async () => {
    const res = await api.get('/admin/workers');
    return res.data;
};

export default api;
