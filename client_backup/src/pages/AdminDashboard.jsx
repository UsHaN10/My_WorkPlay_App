import React, { useEffect, useState, useCallback } from 'react';
import { getWorkers, createTask, getTasks, getAdminExchangeRequests, processExchangeRequest, reviewTask, deleteTask, getSkillsConfig } from '../api';
import { LogOut, Users, Plus, LayoutList, Zap, Award, Coins, Target, ChevronRight, Filter, Trophy, User, Check, X, MessageSquare, AlertCircle, Activity, Clock, ShieldCheck, Eye, ExternalLink, CheckCircle, Download } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../SocketContext';
import { toast } from 'react-hot-toast';
import AdminAnalytics from '../components/AdminAnalytics';
import RankBadge from '../components/RankBadge';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [workers, setWorkers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [exchangeRequests, setExchangeRequests] = useState([]);
    const [skillsConfig, setSkillsConfig] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', rewardCoins: 10, rewardXp: 10, rewardSp: 5, assignedToUserId: '', targetRole: '', skillPointMap: {} });
    const [view, setView] = useState('workers'); // 'workers', 'tasks', 'requests'
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'approve', 'reject'
    const [adminMessage, setAdminMessage] = useState('');

    // Verification Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [reviewModalAction, setReviewModalAction] = useState(null); // 'approve', 'reject'
    const [adminComment, setAdminComment] = useState('');

    const refreshData = useCallback(async () => {
        try {
            const [w, t, r, sc] = await Promise.all([getWorkers(), getTasks(), getAdminExchangeRequests(), getSkillsConfig()]);
            setWorkers(w);
            setTasks(t);
            setExchangeRequests(r);
            setSkillsConfig(sc);
        } catch (err) {
            console.error("Refresh failed", err);
        }
    }, []);

    useEffect(() => {
        refreshData();
        // Socket Listeners
        if (socket) {
            socket.on('MINT_UPDATE', refreshData);
            socket.on('TASK_UPDATE', refreshData);
            socket.on('STATS_UPDATE', refreshData);
        }
        return () => {
            if (socket) {
                socket.off('MINT_UPDATE', refreshData);
                socket.off('TASK_UPDATE', refreshData);
                socket.off('STATS_UPDATE', refreshData);
            }
        };
    }, [socket, refreshData]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const taskData = { ...newTask };
            if (Object.keys(taskData.skillPointMap).length > 0) {
                taskData.skillCategory = JSON.stringify(taskData.skillPointMap);
                taskData.rewardSp = Object.values(taskData.skillPointMap).reduce((a, b) => a + Number(b), 0);
            }
            delete taskData.skillPointMap;

            if (!taskData.assignedToUserId) delete taskData.assignedToUserId;
            if (!taskData.targetRole) delete taskData.targetRole;
            if (!taskData.skillCategory) delete taskData.skillCategory;

            await createTask(taskData);
            setNewTask({ title: '', description: '', rewardCoins: 10, rewardXp: 10, rewardSp: 5, assignedToUserId: '', targetRole: '', skillPointMap: {} });
            refreshData();
        } catch (err) {
            toast.error('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const openProcessModal = (req, action) => {
        setSelectedRequest(req);
        setModalAction(action);
        setAdminMessage('');
    };

    const closeProcessModal = () => {
        setSelectedRequest(null);
        setModalAction(null);
        setAdminMessage('');
    };

    const submitProcess = async (actionOverride) => {
        const action = actionOverride || modalAction;
        if (!selectedRequest || !action) return;

        try {
            await processExchangeRequest(selectedRequest.id, action === 'approve' ? 'approved' : 'rejected', adminMessage);
            closeProcessModal();
            refreshData();
            toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            toast.error('Failed to process request');
        }
    };

    const handleReviewTask = async (actionOverride) => {
        const action = actionOverride || reviewModalAction;
        if (!selectedTask || !action) return;

        setLoading(true);
        try {
            await reviewTask(selectedTask.id, action, adminComment);
            setSelectedTask(null);
            setReviewModalAction(null);
            setAdminComment('');
            refreshData();
            toast.success(`Task ${action === 'approve' ? 'approved' : 'rejected'}!`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Review failed');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        toast.success('Logged out successfully');
    };

    const calculateEffort = (workerId) => {
        const workerTasks = tasks.filter(t => t.assignedToUserId === workerId);
        if (workerTasks.length === 0) return 0;
        return Math.round((workerTasks.filter(t => t.status === 'completed').length / workerTasks.length) * 100);
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

        try {
            await deleteTask(taskId);
            refreshData();
            toast.success('Task deleted successfully');
        } catch (err) {
            toast.error('Failed to delete task');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col z-20 sticky top-0 h-screen">
                <div className="flex flex-col items-center mb-10">
                    <img src="/logo.png" alt="WorkPlay" className="w-32 h-32 object-contain mb-1" />
                    <div className="flex items-baseline text-xl font-black tracking-tighter">
                        <span className="text-slate-900">Work</span>
                        <span className="text-orange-500">play</span>
                    </div>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-[0.2em] leading-none mt-2">Admin Central</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setView('workers')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'workers' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Users size={20} /> Workers
                    </button>
                    <button
                        onClick={() => setView('tasks')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'tasks' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <LayoutList size={20} /> Tasks
                    </button>
                    <button
                        onClick={() => setView('requests')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'requests' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Coins size={20} /> Exchange Requests
                        {exchangeRequests.length > 0 && (
                            <span className="ml-auto bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{exchangeRequests.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setView('verification')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'verification' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <ShieldCheck size={20} /> Verification
                        {tasks.filter(t => t.status === 'pending_review').length > 0 && (
                            <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {tasks.filter(t => t.status === 'pending_review').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setView('treasury')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'treasury' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Target size={20} /> Treasury
                    </button>
                    <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all">
                        <Trophy size={20} /> Rankings
                    </Link>
                    <button
                        onClick={() => setView('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Activity size={20} /> Analytics
                    </button>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-all">
                        <User size={20} /> Settings
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 max-w-7xl mx-auto overflow-y-auto">
                <AnimatePresence mode="wait">
                    {view === 'workers' && (
                        <motion.div
                            key="workers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            <header>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Worker Analytics</h2>
                                <p className="text-slate-500 font-medium">Monitor real-time performance and effort scores across your plant.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {workers.map((worker) => {
                                    const effort = calculateEffort(worker.id);
                                    return (
                                        <div key={worker.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-rose-300 transition-all group hover:shadow-xl hover:shadow-slate-200/50">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all border border-slate-100">
                                                        {worker.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900">{worker.username}</h3>
                                                        <RankBadge rank={worker.rank} size={14} showLabel className="scale-90 origin-left" />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-amber-600 flex items-center gap-1 justify-end">
                                                        <Coins size={14} /> {worker.coins}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Total Coins</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
                                                        <span>Effort Score</span>
                                                        <span className={effort > 70 ? 'text-emerald-500' : 'text-amber-500'}>{effort}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${effort}%` }}
                                                            className={`h-full ${effort > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Growth: {worker.xp} XP</div>
                                                    <button className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors">Details <ChevronRight className="inline" size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {workers.length === 0 && (
                                <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No workers registered yet.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            <header>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Task Management</h2>
                                <p className="text-slate-500 font-medium">Deploy new objectives and assign tasks to specific units.</p>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Create Task Form */}
                                <div className="lg:col-span-4">
                                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 sticky top-10 shadow-sm">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                                <Plus size={20} />
                                            </div>
                                            New Deployment
                                        </h3>
                                        <form onSubmit={handleCreateTask} className="space-y-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Title</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-slate-400"
                                                    value={newTask.title}
                                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                                    placeholder="Task Name"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Details</label>
                                                <textarea
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-slate-400"
                                                    rows={3}
                                                    value={newTask.description}
                                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                                    placeholder="Describe the objective..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-center block">Coins</label>
                                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-center font-bold" value={newTask.rewardCoins} onChange={e => setNewTask({ ...newTask, rewardCoins: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-center block">XP</label>
                                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-center font-bold" value={newTask.rewardXp} onChange={e => setNewTask({ ...newTask, rewardXp: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-center block">Global Skill Points (Overrides detailed skill map if map is empty)</label>
                                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-center font-bold" value={newTask.rewardSp} onChange={e => setNewTask({ ...newTask, rewardSp: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assign To Worker (For Extra Tasks)</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer"
                                                    value={newTask.assignedToUserId}
                                                    onChange={e => setNewTask({ ...newTask, assignedToUserId: e.target.value, targetRole: '' })}
                                                >
                                                    <option value="">Global Daily Tasks (No Worker selected)</option>
                                                    {workers.map(w => (
                                                        <option key={w.id} value={w.id}>{w.username} ({w.jobRole || 'No Role'})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Role & Skill Tree Selection */}
                                            {skillsConfig && (
                                                <>
                                                    {!newTask.assignedToUserId && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Target Job Role</label>
                                                            <select
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer"
                                                                value={newTask.targetRole}
                                                                onChange={e => setNewTask({ ...newTask, targetRole: e.target.value, skillCategory: '' })}
                                                            >
                                                                <option value="">Any Role (General)</option>
                                                                {skillsConfig.jobRoles.map(role => (
                                                                    <option key={role} value={role}>{role}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* User Skill Graph (Only shown when a worker is selected) */}
                                                    {!!newTask.assignedToUserId && (() => {
                                                        const targetWorker = workers.find(w => w.id === parseInt(newTask.assignedToUserId));
                                                        if (!targetWorker || !targetWorker.jobRole) return <p className="text-xs text-rose-500">Worker has no job role defined</p>;

                                                        const wRole = targetWorker.jobRole;
                                                        const wSkills = targetWorker.skillLevels || {};

                                                        // Flatten skills for this role to see which we should show in the graph
                                                        let flatten = [];
                                                        if (skillsConfig.skillTrees[wRole]) {
                                                            Object.values(skillsConfig.skillTrees[wRole]).forEach(sArr => { flatten = [...flatten, ...sArr]; });
                                                        }

                                                        return (
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                                <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">{targetWorker.username}'s Skill Graph</h4>
                                                                <div className="space-y-2">
                                                                    {flatten.map(skill => {
                                                                        const level = wSkills[skill] || 0;
                                                                        const maxLvl = 100; // arbitrary max for visual scale
                                                                        const pct = Math.min(Math.round((level / maxLvl) * 100), 100);
                                                                        return (
                                                                            <div key={skill}>
                                                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                                                                                    <span>{skill}</span>
                                                                                    <span>{level} SP</span>
                                                                                </div>
                                                                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Skill Category */}
                                                    {(() => {
                                                        // Determine which role to use for the dropdown
                                                        let activeRole = newTask.targetRole;
                                                        if (newTask.assignedToUserId) {
                                                            const w = workers.find(x => x.id === parseInt(newTask.assignedToUserId));
                                                            activeRole = w ? w.jobRole : '';
                                                        }

                                                        if (activeRole && skillsConfig.skillTrees[activeRole]) {
                                                            return (
                                                                <div className="space-y-1.5">
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {(() => {
                                                                            const smap = newTask.skillPointMap || {};
                                                                            const toggleCat = (cat) => {
                                                                                const newMap = { ...smap };
                                                                                if (newMap[cat] !== undefined) {
                                                                                    delete newMap[cat];
                                                                                } else {
                                                                                    newMap[cat] = 5; // Default SP when toggled
                                                                                }
                                                                                setNewTask({ ...newTask, skillPointMap: newMap });
                                                                            };
                                                                            const updateSp = (cat, val) => {
                                                                                setNewTask({ ...newTask, skillPointMap: { ...smap, [cat]: Number(val) } });
                                                                            };
                                                                            const allSkills = Object.values(skillsConfig.skillTrees[activeRole]).flat();

                                                                            return allSkills.map(skill => {
                                                                                const isSelected = smap[skill] !== undefined;
                                                                                return (
                                                                                    <div key={skill} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'}`}>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => toggleCat(skill)}
                                                                                            className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}
                                                                                        >
                                                                                            {skill}
                                                                                        </button>
                                                                                        {isSelected && (
                                                                                            <input
                                                                                                type="number"
                                                                                                value={smap[skill]}
                                                                                                onChange={e => updateSp(skill, e.target.value)}
                                                                                                className="w-12 text-center text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded p-1 outline-none"
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return null;
                                                    })()}
                                                </>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                                            >
                                                {loading ? "Creating..." : "Deploy Task"}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Task list */}
                                <div className="lg:col-span-8 space-y-4">
                                    <div className="flex items-center justify-between px-6 mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Deployment History</span>
                                        <Filter size={16} className="text-slate-400" />
                                    </div>

                                    {tasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-rose-300 transition-all"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-lg text-slate-900">{task.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                                                <div className="flex flex-wrap gap-4 mt-4 items-center">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                        <Coins size={14} /> {task.rewardCoins}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                        <Award size={14} /> {task.rewardXp} XP
                                                    </div>
                                                    {task.rewardSp > 0 && (
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                            <Award size={14} /> {task.rewardSp} SP
                                                        </div>
                                                    )}

                                                    {task.targetRole && (
                                                        <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                            {task.targetRole}
                                                        </span>
                                                    )}
                                                    {task.skillCategory && (() => {
                                                        try {
                                                            const parsed = task.skillCategory.startsWith('{') ? JSON.parse(task.skillCategory) : null;
                                                            if (parsed) {
                                                                return Object.entries(parsed).map(([skill, sp]) => (
                                                                    <div key={skill} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                                                        <span>{skill}</span>
                                                                        <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px]">+{sp} SP</span>
                                                                    </div>
                                                                ));
                                                            }
                                                            return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{task.skillCategory}</span>;
                                                        } catch (e) {
                                                            return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{task.skillCategory}</span>;
                                                        }
                                                    })()}

                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 border-l border-slate-100 pl-4 h-6">
                                                        Assignee: <span className="text-slate-600">{task.assignedToUserId ? workers.find(w => w.id === task.assignedToUserId)?.username : 'GLOBAL'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-3 bg-slate-50 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                                                    title="Delete Task"
                                                >
                                                    <Plus className="rotate-45 text-slate-400 group-hover:text-rose-600" size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {tasks.length === 0 && (
                                        <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                            <LayoutList size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No tasks deployed yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {view === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            <header>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Exchange Requests</h2>
                                <p className="text-slate-500 font-medium">Review and process worker coin exchange submissions.</p>
                            </header>

                            <div className="grid grid-cols-1 gap-4">
                                {exchangeRequests.map(req => (
                                    <div key={req.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-rose-300 transition-all shadow-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                                <Coins size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-lg text-slate-900">{req.User?.username || 'Unknown Worker'}</h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-black text-slate-900">
                                                    {req.amount} <span className="text-sm text-slate-400 font-bold uppercase">WPC</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => openProcessModal(req, 'reject')}
                                                className="px-6 py-3 rounded-xl font-bold bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                            <button
                                                onClick={() => openProcessModal(req, 'approve')}
                                                className="px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                                            >
                                                <Check size={18} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {exchangeRequests.length === 0 && (
                                    <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                        <Coins size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No pending exchange requests.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {view === 'verification' && (
                        <motion.div
                            key="verification"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            <header>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Task Verification</h2>
                                <p className="text-slate-500 font-medium">Review submitted proof and approve rewards for completed objectives.</p>
                            </header>

                            <div className="grid grid-cols-1 gap-6">
                                {tasks.filter(t => t.status === 'pending_review').map(task => (
                                    <div key={task.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group hover:border-indigo-300 transition-all shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-8 items-start flex-1 w-full">
                                            {/* Photo Preview */}
                                            {task.verificationPhoto ? (
                                                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 relative group/photo">
                                                    <img
                                                        src={`http://localhost:5000${task.verificationPhoto}`}
                                                        alt="Proof"
                                                        className="w-full h-full object-cover transition-transform group-hover/photo:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye className="text-white" size={24} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full md:w-48 h-32 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                    No Photo
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-xl text-slate-900 truncate">{task.title}</h4>
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                                        Needs Review
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 mb-4 line-clamp-1 italic">
                                                    Worker: {workers.find(w => w.id === task.assignedToUserId)?.username || 'Unknown'}
                                                </p>
                                                <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-start gap-3">
                                                    <MessageSquare size={14} className="text-slate-400 mt-1 flex-shrink-0" />
                                                    <p className="text-xs text-slate-600 font-medium italic truncate">
                                                        {task.workerComment || "No comment provided"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 w-full lg:w-auto">
                                            <button
                                                onClick={() => { setSelectedTask(task); setReviewModalAction('reject'); setAdminComment(''); }}
                                                className="flex-1 lg:flex-none px-6 py-3 rounded-xl font-bold bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                            <button
                                                onClick={() => { setSelectedTask(task); setReviewModalAction('approve'); setAdminComment(''); }}
                                                className="flex-1 lg:flex-none px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                                            >
                                                <Check size={18} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {tasks.filter(t => t.status === 'pending_review').length === 0 && (
                                    <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                        <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">All verifications are up to date.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {view === 'treasury' && (
                        <TreasuryView user={JSON.parse(localStorage.getItem('user'))} socket={socket} />
                    )}
                    {view === 'analytics' && (
                        <AdminAnalytics />
                    )}
                </AnimatePresence>

                {/* Process Modal */}
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${modalAction === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {modalAction === 'approve' ? <Check size={32} /> : <X size={32} />}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                    {modalAction === 'approve' ? 'Approve Exchange' : 'Reject Exchange'}
                                </h3>
                                <p className="text-slate-500">
                                    {modalAction === 'approve'
                                        ? `Confirm exchange of ${selectedRequest.amount} WPC for ${selectedRequest.User?.username}?`
                                        : `Reject exchange of ${selectedRequest.amount} WPC for ${selectedRequest.User?.username}?`
                                    }
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Reason / Message</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        rows={3}
                                        value={adminMessage}
                                        onChange={e => setAdminMessage(e.target.value)}
                                        placeholder={modalAction === 'approve' ? "Optional message..." : "Reason for rejection (Success message required)..."}
                                        required={modalAction === 'reject'}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => submitProcess('reject')}
                                        disabled={!adminMessage.trim()}
                                        className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => submitProcess('approve')}
                                        className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={closeProcessModal}
                                        className="col-span-2 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Task Review Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex min-h-[520px]">
                                {/* Left Side: Photo */}
                                <div className="hidden md:block w-5/12 bg-slate-900 relative">
                                    {selectedTask.verificationPhoto ? (
                                        <img
                                            src={`http://localhost:5000${selectedTask.verificationPhoto}`}
                                            alt="Proof Full"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            No Photo Evidence
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <div className="px-3 py-1 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-white/10 uppercase tracking-widest">
                                            Evidence
                                        </div>
                                    </div>
                                    {selectedTask.verificationPhoto && (
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <a
                                                href={`http://localhost:5000${selectedTask.verificationPhoto}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <a
                                                href={`http://localhost:5000${selectedTask.verificationPhoto}`}
                                                download={`verification_${selectedTask.id}.jpg`}
                                                className="p-2 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-md rounded-lg text-white transition-all shadow-lg"
                                                title="Download Verification Photo"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Details & Action */}
                                <div className="flex-1 p-8 flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{selectedTask.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Review Submission</p>
                                        </div>
                                        <button onClick={() => setSelectedTask(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                                            <X size={18} className="text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Worker Testimony</p>
                                            <p className="text-sm text-slate-600 italic font-medium">"{selectedTask.workerComment || 'No comment provided'}"</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-amber-50 rounded-2xl p-3 border border-amber-100">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Reward</p>
                                                <p className="font-bold text-slate-900">{selectedTask.rewardCoins} WPC</p>
                                            </div>
                                            <div className="flex-1 bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Value</p>
                                                <p className="font-bold text-slate-900">{selectedTask.rewardXp} XP</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Admin Feedback</label>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 h-24 resize-none"
                                                value={adminComment}
                                                onChange={e => setAdminComment(e.target.value)}
                                                placeholder={reviewModalAction === 'approve' ? "Optional congratulations..." : "Explain why the evidence was rejected..."}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <button
                                            onClick={() => handleReviewTask('reject')}
                                            disabled={loading || !adminComment.trim()}
                                            className="py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <AlertCircle size={18} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleReviewTask('approve')}
                                            disabled={loading}
                                            className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                <>
                                                    <CheckCircle size={18} /> Approve & Pay
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setSelectedTask(null)}
                                            className="col-span-2 py-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Close Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Sub-component for Treasury View to keep file cleaner
const TreasuryView = ({ user, socket }) => {
    const [treasury, setTreasury] = useState({ balance: 0 });
    const [mintRequests, setMintRequests] = useState([]);
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchTreasury = async () => {
        try {
            const data = await import('../api').then(mod => mod.getTreasury());
            setTreasury(data.treasury);
            setMintRequests(data.mintRequests);
        } catch (err) {
            console.error("Treasury fetch fail", err);
        }
    };

    useEffect(() => {
        fetchTreasury();
        if (socket) {
            socket.on('MINT_UPDATE', fetchTreasury);
        }
        return () => {
            if (socket) socket.off('MINT_UPDATE', fetchTreasury);
        };
    }, [socket]);

    const handleMint = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await import('../api').then(mod => mod.requestMint(Number(amount), reference));
            setAmount('');
            setReference('');
            fetchTreasury();
            toast.success("Minting request submitted! Waiting for other admin approval.");
        } catch (err) {
            toast.error(err.response?.data?.error || "Mint failed");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await import('../api').then(mod => mod.approveMint(id));
            fetchTreasury();
            toast.success("Approved minting request.");
        } catch (err) {
            toast.error(err.response?.data?.error || "Approval failed");
        }
    };

    const handleReject = async (id) => {
        if (!confirm("Reject this minting request?")) return;
        try {
            await import('../api').then(mod => mod.rejectMint(id));
            fetchTreasury();
            toast.success("Minting request rejected.");
        } catch (err) {
            toast.error("Rejection failed");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            <header>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Central Treasury</h2>
                <p className="text-slate-500 font-medium">Manage coin supply and minting operations securely.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 opacity-80">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Target size={20} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">Reserve Status</span>
                        </div>
                        <div className="text-5xl font-black mb-2">{treasury.balance?.toLocaleString()}</div>
                        <div className="text-sm font-bold opacity-60 uppercase tracking-widest">Total WPC In Circulation</div>
                    </div>
                </div>

                {/* Mint Form */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Plus className="text-emerald-600" /> Request Minting
                    </h3>
                    <form onSubmit={handleMint} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="1000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Reference</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                placeholder="Bank TRX-12345"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                            >
                                {loading ? 'Submitting...' : 'Submit Mint Request'}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-wide">
                                * Requires approval from another admin to finalize.
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Request History */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <LayoutList className="text-slate-400" /> Operations Log
                </h3>
                <div className="space-y-4">
                    {mintRequests.map(req => (
                        <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-emerald-300 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${req.status === 'pending' ? 'bg-amber-50 text-amber-600' : req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {req.status === 'pending' ? 'P' : req.status === 'approved' ? 'A' : 'R'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-slate-900">Mint {req.amount} WPC</span>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest">{req.paymentReference}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold">
                                        Requested by <span className="text-slate-600">{req.requester?.username}</span> on {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {req.status === 'pending' && req.requesterId !== user.id && (
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => handleReject(req.id)} className="flex-1 md:flex-none px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-xl text-sm transition-all">Reject</button>
                                    <button onClick={() => handleApprove(req.id)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-200">Approve</button>
                                </div>
                            )}

                            {req.status === 'pending' && req.requesterId === user.id && (
                                <div className="px-4 py-2 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl">
                                    Waiting for approval
                                </div>
                            )}

                            {req.status === 'approved' && (
                                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-xl border border-emerald-100">
                                    Approved by {req.MintApprovals?.[0]?.approver?.username || 'Admin'}
                                </div>
                            )}
                        </div>
                    ))}
                    {mintRequests.length === 0 && (
                        <div className="py-12 text-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-200 rounded-3xl">
                            No minting operations found.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
