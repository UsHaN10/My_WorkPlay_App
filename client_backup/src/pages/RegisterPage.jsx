import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { ArrowLeft, Zap, User, Lock, UserPlus, Mail, Briefcase, Contact } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ role }) => {
    // const { role } = useParams(); // Removed in favor of prop
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [department] = useState('Production Department'); // Locked
    const [jobRole, setJobRole] = useState('Sewing Machine Operator');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!role) throw new Error('Role is undefined');
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
            const data = await register(username, password, role, fullName, email, department, jobRole);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            navigate(role === 'admin' ? '/admin' : '/worker');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isWorker = role === 'worker';
    const mainColorClass = isWorker ? 'indigo-600' : 'rose-600';
    const bgColorClass = isWorker ? 'bg-indigo-50/50' : 'bg-rose-50/50';

    return (
        <div className={`min-h-screen ${bgColorClass} flex items-center justify-center p-6 relative overflow-hidden`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col items-center mb-8">
                        <Link to={`/login/${role}`} className="self-start mb-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 text-sm font-medium">
                            <ArrowLeft size={16} /> Back to login
                        </Link>

                        <div className={`w-14 h-14 ${isWorker ? 'bg-indigo-600' : 'bg-rose-600'} rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-100`}>
                            <UserPlus className="text-white" size={28} />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                            Create Account
                        </h2>
                        <p className="text-slate-500 text-sm text-center">
                            Join the WorkPlay industrial ecosystem today.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 text-xs font-semibold text-center"
                        >
                            {typeof error === 'string' ? error : JSON.stringify(error)}
                            {error.details && (
                                <ul className="mt-2 list-disc list-inside text-left">
                                    {error.details.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            )}
                        </motion.div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                            <div className="relative">
                                <Contact className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm font-medium"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Department *</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-500 focus:outline-none transition-all text-sm font-medium appearance-none cursor-not-allowed">
                                    <option>Production Department</option>
                                </select>
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">Only the Production Department is currently accessible.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm font-medium"
                                        placeholder="email@work.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Role / Pos.</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium appearance-none"
                                        value={jobRole}
                                        onChange={(e) => setJobRole(e.target.value)}
                                    >
                                        <option value="Sewing Machine Operator">Sewing Machine Operator</option>
                                        <option value="Line Leader">Line Leader</option>
                                        <option value="Production Supervisor">Production Supervisor</option>
                                        <option value="Production Manager">Production Manager</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm font-medium"
                                    placeholder="your_username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm font-medium"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 ${isWorker ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} rounded-xl text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Create Account <ArrowLeft className="rotate-180" size={18} /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 text-sm">
                        Already have an account? <Link to={`/login/${role}`} className="text-indigo-600 font-bold hover:underline underline-offset-4">Sign in here</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
