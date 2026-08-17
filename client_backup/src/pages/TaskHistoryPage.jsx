import React, { useEffect, useState } from 'react';
import { getTasks } from '../api';
import { CheckCircle, ArrowLeft, Target, Award, Coins, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TaskHistoryPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const data = await getTasks(user.id);
            // Only show completed tasks in history
            setTasks(data.filter(t => t.status === 'completed').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        } catch (err) {
            console.error("Task history fetch failed", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 md:p-10 relative overflow-hidden">
            <main className="relative z-10 max-w-5xl mx-auto">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link
                            to="/worker"
                            className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all font-bold text-slate-400 hover:text-slate-900 group shadow-sm"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                <CheckCircle className="text-emerald-500" size={32} /> Task History
                            </h1>
                            <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">Archive of Completed Operations</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 px-10 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                        <div className="flex flex-col items-center">
                            <Target className="text-indigo-600 mb-1" size={20} />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Deployments</span>
                            <span className="text-xl font-black text-slate-900">{tasks.length}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="flex flex-col items-center">
                            <Award className="text-amber-500 mb-1" size={20} />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Net XP Earned</span>
                            <span className="text-xl font-black text-slate-900">{tasks.reduce((acc, t) => acc + t.rewardXp, 0)}</span>
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    {tasks.length > 0 ? (
                        tasks.map((task, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={task.id}
                                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8 group hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
                            >
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                                        <CheckCircle className="text-emerald-600" size={28} />
                                    </div>
                                    <div className="max-w-xl">
                                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-emerald-700 transition-colors uppercase">{task.title}</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-4">{task.description}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                                                <Calendar size={12} className="text-slate-400" />
                                                COMPLETED {new Date(task.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80">
                                    <div className="text-center px-6 border-r border-slate-200/60">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">XP GAIN</div>
                                        <div className="text-xl font-black text-indigo-600">+{task.rewardXp}</div>
                                    </div>
                                    <div className="text-center px-6">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CREDITS</div>
                                        <div className="text-xl font-black text-amber-600">+{task.rewardCoins}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[4rem]">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 border border-slate-100">
                                <Target size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">History Inactive</h3>
                            <p className="text-slate-500 max-w-md mx-auto mt-3 font-medium px-6 leading-relaxed">Execute your primary directives to establish your professional legacy on the platform.</p>
                            <Link to="/worker" className="inline-flex items-center gap-3 mt-10 px-10 py-4 bg-indigo-600 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                                Return to Operations <ChevronRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TaskHistoryPage;
