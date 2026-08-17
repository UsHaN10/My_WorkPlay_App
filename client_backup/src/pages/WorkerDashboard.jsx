import React, { useEffect, useState, useCallback } from 'react';
import { getTasks, submitTask, getRewards, redeemReward, getTransactions, uploadProfilePic, getUser, unassignTask, unsubmitTask, getSkillsConfig } from '../api';
import { getRankBg, getRankColor, getNextRankXp, getRankGlow } from '../utils';
import {
    LayoutDashboard, ClipboardList, CheckCircle, Zap, Shield, Coffee, Clock, X, ShoppingBag, Target, User, Trophy, Wallet, History, ChevronRight, Filter, Upload, Image as ImageIcon, Send, Award, Coins, LogOut, Star
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../SocketContext';
import { toast } from 'react-hot-toast';

import RankBadge from '../components/RankBadge';
import RankUpCelebration from '../components/RankUpCelebration';

const WorkerDashboard = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [tasks, setTasks] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [skillsConfig, setSkillsConfig] = useState(null);
    const [showRewards, setShowRewards] = useState(false);
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'global'
    const [submittingTask, setSubmittingTask] = useState(null);
    const [submissionData, setSubmissionData] = useState({ photo: null, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newRankAchieved, setNewRankAchieved] = useState(null);

    const RankGlowOverlay = ({ rank, persistent = false }) => {
        const glowColor = getRankGlow(rank);
        const isHighRank = ['Diamond', 'Platiner'].includes(rank);
        const isMidRank = ['Gold', 'Silver'].includes(rank);

        const baseOpacity = isHighRank ? [0.4, 0.6, 0.4] : isMidRank ? [0.2, 0.3, 0.2] : [0.1, 0.15, 0.1];
        const pulseDuration = isHighRank ? 6 : isMidRank ? 8 : 12;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: persistent ? baseOpacity : [0.7, 0.9, 0.7],
                }}
                transition={{
                    duration: persistent ? pulseDuration : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="fixed inset-0 pointer-events-none transition-all duration-1000"
                style={{
                    zIndex: persistent ? 1 : 100,
                    background: isHighRank ? `
                        radial-gradient(circle at 0% 0%, ${glowColor} 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, ${glowColor} 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, ${glowColor} 10%, transparent 80%)
                    ` : `
                        radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)
                    `,
                    filter: isHighRank ? 'blur(40px)' : 'blur(20px)',
                }}
            />
        );
    };

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        console.log(`[Socket] Refreshing data for user ${user.id}...`);
        try {
            const [tasksData, userData, skillsData] = await Promise.all([
                getTasks(user.id),
                getUser(user.id),
                getSkillsConfig()
            ]);
            setTasks(tasksData);
            setSkillsConfig(skillsData);
            if (userData) {
                // Check for Rank Up!
                const oldRank = user.rank;
                const newRank = userData.rank;
                if (oldRank && newRank && oldRank !== newRank) {
                    setNewRankAchieved(newRank);
                }

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }
        } catch (err) {
            console.error("Fetch failed", err);
        }
    }, [user.id]); // Only depend on ID to prevent infinite loop

    useEffect(() => {
        fetchData();
        fetchRewards();

        if (socket) {
            socket.on('TASK_UPDATE', fetchData);
            socket.on('MINT_UPDATE', fetchData);
            socket.on('STATS_UPDATE', fetchData); // Added to ensure real-time sync
        }
        return () => {
            if (socket) {
                socket.off('TASK_UPDATE', fetchData);
                socket.off('MINT_UPDATE', fetchData);
                socket.off('STATS_UPDATE', fetchData);
            }
        };
    }, [socket, fetchData]);

    const fetchRewards = async () => {
        try {
            const data = await getRewards();
            setRewards(data);
        } catch (err) {
            console.error("Rewards fetch failed", err);
        }
    };

    const handleRedeem = async (rewardId) => {
        try {
            await redeemReward(rewardId, user.id);
            fetchData();
            toast.success('Reward redeemed successfully!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Redemption failed');
        }
    };

    const handleComplete = async (taskId) => {
        setSubmittingTask(tasks.find(t => t.id === taskId));
        setSubmissionData({ photo: null, comment: '' });
    };

    const handleActualSubmit = async (e) => {
        e.preventDefault();
        if (!submittingTask) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            if (submissionData.photo) {
                formData.append('verificationPhoto', submissionData.photo);
            }
            formData.append('workerComment', submissionData.comment);

            await submitTask(submittingTask.id, formData);
            fetchData();
            toast.success('Task submitted for review!');
            setSubmittingTask(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnassign = async (taskId) => {
        if (!confirm('Are you sure you want to remove this task from your missions? it will return to the global pool.')) return;
        try {
            await unassignTask(taskId);
            fetchData();
            toast.success('Task removed from your missions');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to unassign task');
        }
    };

    const handleUnsubmit = async (taskId) => {
        if (!confirm('Are you sure you want to cancel this submission?')) return;
        try {
            await unsubmitTask(taskId);
            fetchData();
            toast.success('Submission cancelled');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to unsubmit task');
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        toast.success('Logged out successfully');
    };

    const nextRankXp = getNextRankXp(user.rank);

    const progressPercent = Math.min((user.xp / nextRankXp) * 100, 100);

    const filteredTasks = tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'pending_review') return false;
        if (activeTab === 'assigned') return t.assignedToUserId == user.id;
        return t.assignedToUserId === null;
    });

    console.log(`Tab: ${activeTab}, Total Tasks: ${tasks.length}, Filtered Tasks: ${filteredTasks.length}`);
    if (tasks.length > 0 && filteredTasks.length === 0) {
        console.log("Tasks are being filtered out. Statuses:", tasks.map(t => t.status));
        console.log("Assignments:", tasks.map(t => t.assignedToUserId), "User ID:", user.id);
    }

    const pendingReviewTasks = tasks.filter(t => t.status === 'pending_review' && t.assignedToUserId == user.id);

    const effortScore = tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
        : 0;

    const RewardIcon = ({ name }) => {
        switch (name) {
            case 'Coffee': return <Coffee />;
            case 'Shield': return <Shield />;
            case 'Clock': return <Clock />;
            default: return <ShoppingBag />;
        }
    };

    // Get material background color based on rank
    const getRankBackground = (rank) => {
        switch (rank) {
            case 'Diamond':
                return 'bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100';
            case 'Platiner':
                return 'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100';
            case 'Gold':
                return 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100';
            case 'Silver':
                return 'bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100';
            case 'Bronze':
                return 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100';
            default:
                return 'bg-slate-50';
        }
    };

    return (
        <div className={`min-h-screen ${getRankBackground(user?.rank)} flex text-slate-900 relative overflow-hidden transition-all duration-1000`}>
            {/* Persistent Background Glow based on current Rank - Root Level */}
            {user?.rank && <RankGlowOverlay rank={user.rank} persistent={true} />}

            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col z-20 sticky top-0 h-screen">
                <div className="flex flex-col items-center mb-10">
                    <img src="/logo.png" alt="WorkPlay" className="h-28 w-auto object-contain mb-1" />
                    <div className="flex items-baseline text-xl font-black tracking-tighter">
                        <span className="text-slate-900">Work</span>
                        <span className="text-orange-500">play</span>
                    </div>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em] leading-none mt-2">Worker Hub</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link to="/worker" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold transition-all">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all">
                        <Wallet size={20} /> My Wallet
                    </Link>
                    <Link to="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all">
                        <History size={20} /> Task History
                    </Link>
                    <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all">
                        <Trophy size={20} /> Leaderboard
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100 space-y-4">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all group">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                            {user.profilePic ? (
                                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-slate-400" size={20} />
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{user.fullName || user.username}</p>
                            <RankBadge rank={user.rank} size={14} showLabel className="mt-1" />
                        </div>
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 relative z-10">
                {/* Epic Rank Banner - Top Center */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="relative w-full max-w-4xl"
                        style={{ height: '280px' }}
                    >
                        {/* Banner Background with Gradient */}
                        <div
                            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                            style={{
                                background: user.rank === 'Diamond'
                                    ? 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 30%, #06b6d4 50%, #0e7490 70%, #0c4a6e 100%)'
                                    : user.rank === 'Platiner'
                                        ? 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 30%, #8b5cf6 50%, #6d28d9 70%, #4c1d95 100%)'
                                        : user.rank === 'Gold'
                                            ? 'linear-gradient(135deg, #78350f 0%, #b45309 30%, #f59e0b 50%, #b45309 70%, #78350f 100%)'
                                            : user.rank === 'Silver'
                                                ? 'linear-gradient(135deg, #334155 0%, #64748b 30%, #94a3b8 50%, #64748b 70%, #334155 100%)'
                                                : 'linear-gradient(135deg, #7c2d12 0%, #c2410c 30%, #fb923c 50%, #c2410c 70%, #7c2d12 100%)'
                            }}
                        >
                            {/* Animated Light Rays */}
                            {Array.from({ length: 16 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        opacity: [0.1, 0.3, 0.1],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute top-1/2 left-1/2 w-full h-1 origin-left"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${user.rank === 'Diamond' ? '#67e8f9' :
                                            user.rank === 'Platiner' ? '#c4b5fd' :
                                                user.rank === 'Gold' ? '#fcd34d' :
                                                    user.rank === 'Silver' ? '#e2e8f0' : '#fdba74'
                                            }, transparent)`,
                                        transform: `rotate(${i * 22.5}deg)`,
                                        filter: 'blur(1px)'
                                    }}
                                />
                            ))}

                            {/* Floating Particles */}
                            {Array.from({ length: 25 }, (_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    animate={{
                                        y: [280, -20],
                                        x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 3,
                                        ease: "linear"
                                    }}
                                    className="absolute w-1 h-1 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        bottom: 0,
                                        backgroundColor: user.rank === 'Diamond' ? '#67e8f9' :
                                            user.rank === 'Platiner' ? '#c4b5fd' :
                                                user.rank === 'Gold' ? '#fcd34d' :
                                                    user.rank === 'Silver' ? '#e2e8f0' : '#fdba74',
                                        boxShadow: `0 0 10px ${user.rank === 'Diamond' ? '#22d3ee' :
                                            user.rank === 'Platiner' ? '#a78bfa' :
                                                user.rank === 'Gold' ? '#fbbf24' :
                                                    user.rank === 'Silver' ? '#cbd5e1' : '#fb923c'
                                            }`
                                    }}
                                />
                            ))}

                            {/* Diagonal Light Sweep */}
                            <motion.div
                                animate={{
                                    x: ['-100%', '200%'],
                                    opacity: [0.2, 0.5, 0.2]
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(120deg, transparent 30%, ${user.rank === 'Diamond' ? 'rgba(103, 232, 249, 0.4)' :
                                        user.rank === 'Platiner' ? 'rgba(196, 181, 253, 0.4)' :
                                            user.rank === 'Gold' ? 'rgba(252, 211, 77, 0.4)' :
                                                user.rank === 'Silver' ? 'rgba(226, 232, 240, 0.4)' : 'rgba(253, 186, 116, 0.4)'
                                        } 50%, transparent 70%)`,
                                    filter: 'blur(20px)'
                                }}
                            />
                        </div>

                        {/* Content Layer */}
                        <div className="relative h-full flex items-center justify-center">
                            {/* Shield Icon */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute left-20"
                            >
                                <Shield
                                    size={120}
                                    className="text-white/30"
                                    strokeWidth={1.5}
                                    fill="currentColor"
                                    style={{
                                        filter: `drop-shadow(0 0 20px ${user.rank === 'Diamond' ? '#22d3ee' :
                                            user.rank === 'Platiner' ? '#a78bfa' :
                                                user.rank === 'Gold' ? '#fbbf24' :
                                                    user.rank === 'Silver' ? '#cbd5e1' : '#fb923c'
                                            })`
                                    }}
                                />
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                >
                                    <Star
                                        size={35}
                                        className="text-white"
                                        fill="white"
                                        style={{
                                            filter: `drop-shadow(0 0 15px ${user.rank === 'Diamond' ? '#22d3ee' :
                                                user.rank === 'Platiner' ? '#a78bfa' :
                                                    user.rank === 'Gold' ? '#fbbf24' :
                                                        user.rank === 'Silver' ? '#cbd5e1' : '#fb923c'
                                                })`
                                        }}
                                    />
                                </motion.div>
                            </motion.div>

                            {/* Rank Text */}
                            <div className="text-center">
                                <motion.h1
                                    animate={{
                                        textShadow: [
                                            `0 0 20px ${getRankGlow(user.rank)}`,
                                            `0 0 40px ${getRankGlow(user.rank)}`,
                                            `0 0 20px ${getRankGlow(user.rank)}`
                                        ]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="text-8xl font-black text-white uppercase tracking-[0.2em]"
                                    style={{
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        textShadow: `0 0 30px ${getRankGlow(user.rank)}, 0 4px 8px rgba(0,0,0,0.5)`
                                    }}
                                >
                                    {user.rank}
                                </motion.h1>
                                <motion.p
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xl font-bold text-white/90 uppercase tracking-[0.4em] mt-2"
                                    style={{
                                        textShadow: `0 0 15px ${getRankGlow(user.rank)}`
                                    }}
                                >
                                    Tier Rating
                                </motion.p>
                            </div>

                            {/* Decorative Badge */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, -2, 2, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 2
                                }}
                                className="absolute right-20"
                            >
                                <RankBadge rank={user.rank} size={80} showLabel={false} />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Header Section */}
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back, {user.fullName?.split(' ')[0] || user.username}!</h2>
                        <p className="text-slate-500 font-medium tracking-tight">Here's what's happening in your plant today.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowRewards(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-100 transition-all active:scale-95"
                        >
                            <ShoppingBag size={18} /> Shop Rewards
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Coins className="text-amber-600" size={24} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Balance</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user.coins} <span className="text-xs font-bold text-slate-400 ml-1">WPC</span></h3>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group">
                        <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm border border-slate-100`}>
                            <RankBadge rank={user.rank} size={24} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Current Rank</p>
                        <h3 className={`text-2xl font-black tracking-tight ${getRankColor(user.rank)}`}>{user.rank}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <CheckCircle className="text-emerald-600" size={24} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tasks Done</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{tasks.filter(t => t.status === 'completed').length}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Target className="text-rose-600" size={24} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Effort Score</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{effortScore}%</h3>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Zap size={16} className="text-indigo-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">Next Rank Progression</span>
                        </div>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{user.xp} / {nextRankXp} XP</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-1 mb-8">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}% ` }}
                            className="h-full bg-indigo-600 rounded-full"
                        />
                    </div>

                    {/* Skill Graph */}
                    {skillsConfig && user.jobRole && skillsConfig.skillTrees[user.jobRole] && (() => {
                        let flatten = [];
                        Object.values(skillsConfig.skillTrees[user.jobRole]).forEach(sArr => { flatten = [...flatten, ...sArr]; });

                        return (
                            <div>
                                <div className="flex items-center gap-3 mb-4 border-t border-slate-100 pt-8">
                                    <div className="p-2 bg-rose-50 rounded-lg">
                                        <Award size={16} className="text-rose-600" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">My Skill Progress ({user.jobRole})</span>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {flatten.map(skill => {
                                        const level = (user.skillLevels && user.skillLevels[skill]) ? user.skillLevels[skill] : 0;
                                        const maxLvl = 100; // arbitrary max
                                        const pct = Math.min(Math.round((level / maxLvl) * 100), 100);
                                        return (
                                            <div key={skill}>
                                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                    <span>{skill}</span>
                                                    <span>{level} SP</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Task Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-slate-200 pb-6">
                    <div className="flex gap-2">
                        {['assigned', 'global'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'}`}
                            >
                                {tab === 'assigned' ? 'Personal Mission' : 'Global Tasks'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Filter size={14} /> Showing {filteredTasks.length} objectives
                    </div>
                </div>

                {/* Tasks Under Review */}
                {pendingReviewTasks.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6 ml-2">
                            <Clock size={18} className="text-amber-500" />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Awaiting Verification ({pendingReviewTasks.length})</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {pendingReviewTasks.map(task => (
                                <div key={task.id} className="bg-white/50 border border-slate-200 border-dashed rounded-3xl p-6 flex flex-col justify-between opacity-80 backdrop-blur-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                            <Clock size={20} />
                                        </div>
                                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            Under Review
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{task.title}</h4>
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">{task.description}</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-xl">
                                            Submitted for {task.rewardCoins} WPC
                                        </div>
                                        <button
                                            onClick={() => handleUnsubmit(task.id)}
                                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                                            title="Cancel Submission"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 pb-20">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, idx) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white border border-slate-200 rounded-3xl p-8 group hover:border-indigo-500 transition-all hover:shadow-xl hover:shadow-slate-200/50"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <Target size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-100">
                                            <Coins size={10} /> {task.rewardCoins}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                                            <Award size={10} /> {task.rewardXp}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{task.title}</h3>
                                <p className="text-slate-500 text-sm mb-8 leading-relaxed h-10 overflow-hidden line-clamp-2">{task.description}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleComplete(task.id)}
                                        className="flex-1 py-4 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 transition-all group/btn"
                                    >
                                        <CheckCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        Complete Mission
                                    </button>
                                    {activeTab === 'assigned' && (
                                        <button
                                            onClick={() => handleUnassign(task.id)}
                                            className="px-4 py-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-slate-400 transition-all"
                                            title="Remove Mission"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredTasks.length === 0 && (
                        <div className="col-span-full py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                                <LayoutDashboard size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No active objectives</h3>
                            <p className="text-sm text-slate-500 mt-1">Stand by for new assignments...</p>
                        </div>
                    )}
                </div>

                {/* Rewards Modal */}
                <AnimatePresence>
                    {showRewards && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        >
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRewards(false)} />
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 10 }}
                                className="relative bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <ShoppingBag className="text-rose-600" /> Rewards Shop
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-100">
                                                <Coins size={10} /> {user.coins} BALANCE
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowRewards(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    {rewards.map(reward => (
                                        <div key={reward.id} className="group bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:border-rose-300 transition-all hover:bg-white">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-rose-600 group-hover:scale-110 transition-transform">
                                                    <RewardIcon name={reward.icon} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{reward.name}</div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                                        <Coins size={12} /> {reward.price} WPC
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRedeem(reward.id)}
                                                className="px-4 py-2 bg-white hover:bg-rose-600 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-slate-200 hover:border-rose-600"
                                            >
                                                REDEEM
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Task Submission Modal */}
                <AnimatePresence>
                    {submittingTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 10 }}
                                className="relative bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <Shield className="text-indigo-600" /> Complete Mission
                                        </h2>
                                        <p className="text-xs font-medium text-slate-500 mt-1">Submit verification for: <span className="text-slate-900 font-bold">{submittingTask.title}</span></p>
                                    </div>
                                    <button onClick={() => setSubmittingTask(null)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleActualSubmit} className="p-8 space-y-6">
                                    {/* Photo Upload */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Verification Card Photo</label>
                                        <div
                                            onClick={() => document.getElementById('photo-upload').click()}
                                            className="relative group cursor-pointer"
                                        >
                                            <div className="h-40 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden">
                                                {submissionData.photo ? (
                                                    <div className="absolute inset-0 p-2">
                                                        <img
                                                            src={URL.createObjectURL(submissionData.photo)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover rounded-2xl"
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Upload className="text-white" size={32} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm text-slate-300 flex items-center justify-center group-hover:scale-110 group-hover:text-indigo-400 transition-all">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-center">
                                                            Click to upload or drag & drop<br />
                                                            <span className="text-[10px] opacity-60">PNG, JPG or JPEG up to 5MB</span>
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => setSubmissionData({ ...submissionData, photo: e.target.files[0] })}
                                            />
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Comment (Optional)</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                            rows={3}
                                            value={submissionData.comment}
                                            onChange={(e) => setSubmissionData({ ...submissionData, comment: e.target.value })}
                                            placeholder="Any details about the task completion..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setSubmittingTask(null)}
                                            className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !submissionData.photo}
                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    Submit Objective
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rank Up Lighting Effect (Intense) */}
                <AnimatePresence>
                    {newRankAchieved && (
                        <div className="fixed inset-0 z-[90] pointer-events-none">
                            <RankGlowOverlay rank={newRankAchieved} persistent={false} />
                        </div>
                    )}
                </AnimatePresence>

                {/* Rank Up Celebration */}
                {newRankAchieved && (
                    <RankUpCelebration
                        newRank={newRankAchieved}
                        onComplete={() => setNewRankAchieved(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default WorkerDashboard;
