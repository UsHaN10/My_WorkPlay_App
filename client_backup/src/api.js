import axios from "axios";

// Dynamically set the API base URL based on hostname
const getBaseURL = () => {
  const hostname = window.location.hostname;
  // Works on both Computer (localhost) and Phone (IP address)
  return `http://${hostname}:5000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    jobRole
  });
  return res.data;
};

export const getTasks = async (userId) => {
  const res = await api.get("/tasks", { params: { userId } });
  return res.data;
};

export const getSkillsConfig = async () => {
  const res = await api.get("/skills/config");
  return res.data;
};

export const createTask = async (taskData) => {
  const res = await api.post("/tasks", taskData);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
};

export const completeTask = async (taskId, userId) => {
  const res = await api.post(`/tasks/${taskId}/complete`, { userId }); // Legacy
  return res.data;
};

export const submitTask = async (taskId, formData) => {
  const res = await api.post(`/tasks/${taskId}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const reviewTask = async (taskId, action, adminComment) => {
  const res = await api.post(`/tasks/${taskId}/review`, {
    action,
    adminComment,
  });
  return res.data;
};

export const unassignTask = async (taskId) => {
  const res = await api.put(`/tasks/${taskId}/unassign`);
  return res.data;
};

export const unsubmitTask = async (taskId) => {
  const res = await api.put(`/tasks/${taskId}/unsubmit`);
  return res.data;
};

export const getWorkers = async () => {
  const res = await api.get("/admin/workers");
  return res.data;
};

export const getLeaderboard = async () => {
  const res = await api.get("/leaderboard");
  return res.data;
};

export const getUser = async (id) => {
  const res = await api.get(`/user/${id}`);
  return res.data;
};

export const getRewards = async () => {
  const res = await api.get("/rewards");
  return res.data;
};

export const redeemReward = async (rewardId, userId) => {
  const res = await api.post(`/rewards/${rewardId}/redeem`, { userId });
  return res.data;
};

export const getTransactions = async (userId) => {
  const res = await api.get(`/transactions/${userId}`);
  return res.data;
};
export const requestExchange = async (userId, amount) => {
  const res = await api.post("/exchange", { userId, amount });
  return res.data;
};

export const getExchangeRequests = async (userId) => {
  const res = await api.get(`/exchange-requests/${userId}`);
  return res.data;
};

export const getAdminExchangeRequests = async () => {
  const res = await api.get("/admin/exchange-requests");
  return res.data;
};

export const processExchangeRequest = async (requestId, status, message) => {
  const res = await api.put(`/admin/exchange-requests/${requestId}`, {
    status,
    message,
  });
  return res.data;
};

// --- Treasury APIs ---
export const getTreasury = async () => {
  const res = await api.get("/admin/treasury");
  return res.data;
};

export const requestMint = async (amount, paymentReference) => {
  const res = await api.post("/admin/mint", { amount, paymentReference });
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

export const uploadProfilePic = async (userId, file) => {
  const formData = new FormData();
  formData.append("profilePic", file);
  const res = await api.post(`/user/${userId}/upload`, formData);
  return res.data;
};

export const getAdminStats = async () => {
  const res = await api.get("/admin/stats");
  return res.data;
};
