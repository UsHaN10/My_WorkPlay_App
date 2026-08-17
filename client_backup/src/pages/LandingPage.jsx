import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Trophy, Coins, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
            {/* Header */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="WorkPlay" className="h-14 w-auto object-contain" />
                        <div className="flex items-baseline text-2xl font-black tracking-tighter">
                            <span className="text-slate-900">Work</span>
                            <span className="text-orange-500">play</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <a href="http://localhost:5174/login/admin" className="text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Admin Login</a>
                        <a href="http://localhost:5173/login/worker" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all">Get Started</a>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="pt-24 pb-32 px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 border border-indigo-100"
                        >
                            <Trophy size={14} /> Professional Industrial Ecosystem
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight"
                        >
                            Make Every Action <br />
                            <span className="text-indigo-600">Count.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed"
                        >
                            A simple, powerful platform for industrial workers to track their effort,
                            complete tasks, and earn meaningful rewards.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <a href="http://localhost:5173/register/worker" className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-all">
                                Create Free Account <ArrowRight size={18} />
                            </a>
                            <a href="http://localhost:5173/login/worker" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                                Worker Login
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-16 flex items-center justify-center gap-12 text-slate-400"
                        >
                            <div className="flex items-center gap-2">
                                <Shield size={18} />
                                <span className="text-sm font-medium">Enterprise Secure</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={18} />
                                <span className="text-sm font-medium">Real-time Stats</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="bg-white py-32 border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-12">
                            {[
                                {
                                    icon: <Zap className="text-indigo-600" />,
                                    title: "Task Management",
                                    desc: "Receive, prioritize and complete your daily industrial tasks with ease."
                                },
                                {
                                    icon: <Coins className="text-rose-500" />,
                                    title: "Reward System",
                                    desc: "Earn WorkPlay Coins for every achievement and redeem them for value."
                                },
                                {
                                    icon: <Trophy className="text-amber-500" />,
                                    title: "Career Growth",
                                    desc: "Build your professional rank and showcase your effort to management."
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="group p-8 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                    <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
                    <p>© 2026 WorkPlay. Simple. Efficient. Productive.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-600">Terms of Use</a>
                        <a href="#" className="hover:text-indigo-600">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
