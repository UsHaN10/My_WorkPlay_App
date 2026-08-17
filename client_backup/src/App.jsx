import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const TaskHistoryPage = lazy(() => import('./pages/TaskHistoryPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Loading Fallback
const PageLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Loading Secure Environment...</p>
        </div>
    </div>
);

// Auth Guard
const PrivateRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Basic Role Check
    if (!user) {
        // Redirect based on App Mode
        const appMode = import.meta.env.VITE_APP_MODE;
        return <Navigate to={appMode === 'admin' ? '/login/admin' : '/login/worker'} />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect unauthorized roles
        return <Navigate to={user.role === 'admin' ? '/admin' : '/worker'} />;
    }
    return children;
};

function App() {
    let appMode = import.meta.env.VITE_APP_MODE; // 'worker' or 'admin'

    // Fallback detection based on Port (Very robust for local dev)
    if (!appMode && typeof window !== 'undefined') {
        const port = window.location.port;
        if (port === '5174') appMode = 'admin';
        else if (port === '5173') appMode = 'worker';
    }

    return (
        <ErrorBoundary>
            <Router>
                <div className="min-h-screen bg-[#f8fafc] text-slate-900">
                    <Suspense fallback={<PageLoading />}>
                        <Routes>
                            {/* Landing Page - Accessible to All? Or specific? */}
                            <Route path="/" element={<LandingPage />} />

                            {/* Mode Specific Routing */}

                            {/* WORKER HOST ROUTES (Port 5173) */}
                            {(appMode === 'worker' || !appMode) && (
                                <>
                                    <Route path="/login/worker" element={<LoginPage role="worker" />} />
                                    <Route path="/register/worker" element={<RegisterPage role="worker" />} />

                                    <Route path="/worker" element={
                                        <PrivateRoute allowedRoles={['worker']}><WorkerDashboard /></PrivateRoute>
                                    } />
                                    <Route path="/wallet" element={
                                        <PrivateRoute allowedRoles={['worker']}><WalletPage /></PrivateRoute>
                                    } />
                                    <Route path="/history" element={
                                        <PrivateRoute allowedRoles={['worker']}><TaskHistoryPage /></PrivateRoute>
                                    } />

                                    {/* Shared but Worker Access */}
                                    <Route path="/leaderboard" element={
                                        <PrivateRoute allowedRoles={['worker']}><LeaderboardPage /></PrivateRoute>
                                    } />
                                    <Route path="/profile" element={
                                        <PrivateRoute allowedRoles={['worker']}><ProfilePage /></PrivateRoute>
                                    } />

                                    {/* Redirect Admin paths to home or error on Worker Host */}
                                    <Route path="/admin/*" element={<Navigate to="/" />} />
                                    <Route path="/login/admin" element={<Navigate to="/" />} />
                                </>
                            )}

                            {/* ADMIN HOST ROUTES (Port 5174) */}
                            {(appMode === 'admin') && (
                                <>
                                    <Route path="/login/admin" element={<LoginPage role="admin" />} />
                                    <Route path="/register/admin" element={<RegisterPage role="admin" />} />

                                    <Route path="/admin" element={
                                        <PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>
                                    } />

                                    {/* Shared but Admin Access */}
                                    <Route path="/leaderboard" element={
                                        <PrivateRoute allowedRoles={['admin']}><LeaderboardPage /></PrivateRoute>
                                    } />
                                    <Route path="/profile" element={
                                        <PrivateRoute allowedRoles={['admin']}><ProfilePage /></PrivateRoute>
                                    } />

                                    {/* Redirect Worker paths to home or error on Admin Host */}
                                    <Route path="/worker/*" element={<Navigate to="/admin" />} />
                                    <Route path="/login/worker" element={<Navigate to="/login/admin" />} />
                                </>
                            )}

                            {/* Catch All - 404 roughly */}
                            <Route path="*" element={<Navigate to="/" />} />

                        </Routes>
                    </Suspense>
                    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#334155', color: '#fff' } }} />
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
