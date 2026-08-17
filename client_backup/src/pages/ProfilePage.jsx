import React, { useState } from 'react';
import { User, Shield, Lock, Bell, ArrowLeft, Camera, Check, LogOut, Upload, ChevronRight } from 'lucide-react';
import { uploadProfilePic } from '../api';
import { getRankColor, getNextRankXp } from '../utils';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import RankBadge from '../components/RankBadge';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const updatedUser = await uploadProfilePic(user.id, file);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    const isWorker = user.role === 'worker';
    const accentColor = isWorker ? 'indigo' : 'rose';

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 md:p-10 relative overflow-hidden">
            <main className="relative z-10 max-w-5xl mx-auto">
                <header className="flex items-center gap-6 mb-12">
                    <Link
                        to={user.role === 'admin' ? '/admin' : '/worker'}
                        className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all font-bold text-slate-400 hover:text-slate-900 group shadow-sm"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
                        <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">Manage your industrial identity</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Avatar & Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 text-center shadow-sm">
                            <div className="relative inline-block mb-6 group">
                                <div className={`w-36 h-36 ${isWorker ? 'bg-indigo-600' : 'bg-rose-600'} rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-slate-200 overflow-hidden border-4 border-white`}>
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user.username ? user.username[0].toUpperCase() : 'U'
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            Uploading
                                        </div>
                                    )}
                                </div>
                                <label className={`absolute bottom-[-5px] right-[-5px] p-3.5 ${isWorker ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} rounded-2xl text-white shadow-xl transition-all cursor-pointer border-4 border-white group-hover:scale-110 active:scale-90`}>
                                    <Camera size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-1">{user.fullName || user.username}</h2>
                            <p className="text-xs text-slate-500 mb-8 uppercase tracking-[0.3em] font-black">{user.role}</p>

                            <div className="pt-8 border-t border-slate-100 w-full text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Rank Evolution</span>
                                <div className="flex justify-between items-center text-xs font-bold mb-3">
                                    <RankBadge rank={user.rank} size={14} showLabel />
                                    <span className="text-slate-400">{user.xp} XP</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((user.xp / getNextRankXp(user.rank)) * 100, 100)}%` }}
                                        className={`h-full rounded-full ${isWorker ? 'bg-indigo-600' : 'bg-rose-600'}`}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-3 text-amber-600 mb-4 bg-amber-50 w-fit px-3 py-1 rounded-full border border-amber-100">
                                <Shield size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Security Protocol</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">Your account data is managed under high-level industrial encryption standards.</p>
                            <div className="space-y-3">
                                <button className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-900 transition-all">Enable 2FA Auth</button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-100"
                                >
                                    <LogOut size={16} /> Terminate Session
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-8">
                        <motion.section
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 space-y-10 shadow-sm"
                        >
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 mb-2 underline-offset-8">
                                    <div className={`p-2 ${isWorker ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'} rounded-xl`}>
                                        <User size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name Identity</label>
                                        <input type="text" defaultValue={user.fullName} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Department Sector</label>
                                        <input type="text" defaultValue={user.department} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">System Username</label>
                                        <input type="text" defaultValue={user.username} className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-400 font-bold cursor-not-allowed opacity-70" disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Email</label>
                                        <input type="email" defaultValue={user.email} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Worker Bio / Objectives</label>
                                    <textarea rows={4} placeholder="Describe your industrial expertise..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none" />
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${isWorker ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'} rounded-xl`}>
                                            <Bell size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Communication</h3>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-full pr-4 border border-slate-200">
                                        <div className={`w-10 h-6 ${isWorker ? 'bg-indigo-600' : 'bg-rose-600'} rounded-full relative cursor-pointer active:scale-90 transition-all`}>
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Receive real-time intelligence on new task deployments, rank advancements, and reward redemptions.</p>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={handleSave}
                                    className={`px-12 py-4 ${isWorker ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} rounded-2xl font-black text-white shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3`}
                                >
                                    {saved ? <><Check size={20} /> Identity Updated</> : <>Push Changes <ChevronRight size={18} /></>}
                                </button>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
