import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../api';
import { useSocket } from '../SocketContext';
import { getRankStyles, getRankColor } from '../utils';
import { Trophy, Medal, ArrowLeft, TrendingUp, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import RankBadge from '../components/RankBadge';

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [workers, setWorkers] = useState([]);
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        fetchWorkers();

        if (socket) {
            const handleUpdate = () => {
                console.log("Leaderboard refreshing via socket...");
                fetchWorkers();
            };

            socket.on('TASK_UPDATE', handleUpdate);
            socket.on('STATS_UPDATE', handleUpdate);

            return () => {
                socket.off('TASK_UPDATE', handleUpdate);
                socket.off('STATS_UPDATE', handleUpdate);
            };
        }
    }, [socket]);

    const fetchWorkers = async () => {
        try {
            const data = await getLeaderboard();
            if (data && Array.isArray(data)) {
                // Server now returns sorted by XP via the route order
                setWorkers(data);
            } else {
                console.warn("Leaderboard data is not an array:", data);
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard", err);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    const getRankIcon = (index, workerRank) => {
        const topIcons = [
            <Trophy className="text-amber-500" size={24} />,
            <Medal className="text-slate-400" size={24} />,
            <Medal className="text-orange-400" size={24} />
        ];

        return (
            <div className="relative flex items-center justify-center">
                <RankBadge rank={workerRank} size={index < 3 ? 48 : 36} />
                {index < 3 && (
                    <div className="absolute -top-3 -right-3 p-1.5 bg-white rounded-full shadow-lg border border-slate-100">
                        {topIcons[index]}
                    </div>
                )}
                {index >= 3 && (
                    <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 border-2 border-white shadow-sm">
                        {index + 1}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 md:p-10 relative overflow-hidden">
            <main className="relative z-10 max-w-5xl mx-auto">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link
                            to={user.role === 'admin' ? '/admin' : '/worker'}
                            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all font-bold text-slate-400 hover:text-slate-900 group shadow-sm"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                <Trophy className="text-amber-500" size={32} /> Leaderboard
                            </h1>
                            <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">Industrial Performance Standings</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 px-10 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                        <div className="flex flex-col items-center">
                            <Users className="text-indigo-600 mb-1" size={20} />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Fleet</span>
                            <span className="text-xl font-black text-slate-900">{workers.length}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="flex flex-col items-center">
                            <TrendingUp className="text-amber-500 mb-1" size={20} />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global XP</span>
                            <span className="text-xl font-black text-slate-900">{workers.reduce((acc, w) => acc + w.xp, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </header>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4 pb-20"
                >
                    {workers.map((worker, index) => (
                        <motion.div
                            key={worker.id}
                            variants={itemVariants}
                            className={`group bg-white border rounded-[2.5rem] p-6 flex items-center gap-8 transition-all hover:shadow-xl hover:shadow-slate-200/50 ${worker.id === user.id ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-lg' : 'border-slate-200'}`}
                        >
                            <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                {getRankIcon(index, worker.rank)}
                            </div>

                            <div className="flex-1 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-inner border-2 ${getRankStyles(worker.rank)}`}>
                                        {(worker.username || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                            {worker.username || 'Anonymous'}
                                            {worker.id === user.id && <span className="text-[10px] px-3 py-1 bg-indigo-600 text-white font-black rounded-full uppercase tracking-widest">Active Individual</span>}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <RankBadge rank={worker.rank} size={14} showLabel className="scale-75 origin-left" />
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industrial Tier {Math.floor(worker.xp / 1000) + 1}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10 xl:pr-8">
                                    <div className="text-left xl:text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Accumulated XP</div>
                                        <div className="text-2xl font-black text-slate-900 tabular-nums">{worker.xp.toLocaleString()}</div>
                                    </div>
                                    <div className="text-left xl:text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Net Credit Yield</div>
                                        <div className="text-2xl font-black text-amber-500 tabular-nums">{worker.coins.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
};

export default LeaderboardPage;
