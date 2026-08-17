import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminLogin, workerLogin } from '../api';
import { ArrowLeft, Zap, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ role }) => {
    // const { role } = useParams(); // Removed in favor of prop
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isWorker = role === 'worker';

    useEffect(() => {
        document.title = isWorker ? 'Workplay | Worker Portal' : 'Workplay | Admin Portal';
    }, [isWorker]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log(`Frontend Login Request: "${username}" with password length ${password.length} as ${role}`);
            const data = role === 'admin' ? await adminLogin(username, password) : await workerLogin(username, password);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            navigate(role === 'admin' ? '/admin' : '/worker');
        } catch (err) {
            if (err.response?.status === 401 && err.response?.data?.roleMismatch) {
                setError(`This account is registered as an ${err.response.data.actualRole}. Please use the ${err.response.data.actualRole} portal.`);
            } else {
                setError('Login failed. Check credentials or ensure you are registered.');
            }
        } finally {
            setLoading(false);
        }
    };

    const mainColor = isWorker ? 'indigo-600' : 'rose-600';
    const bgColor = isWorker ? 'bg-indigo-50/50' : 'bg-rose-50/50';

    return (
        <div className={`min-h-screen ${bgColor} flex items-center justify-center p-6`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="self-start mb-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 text-sm font-medium">
                            <ArrowLeft size={16} /> Back to home
                        </Link>

                        <div className="w-40 h-40 mb-2 relative">
                            <img src="/logo.png" alt="WorkPlay" className="w-full h-full object-contain drop-shadow-xl" />
                        </div>

                        <div className="flex items-baseline text-4xl font-black tracking-tighter mb-8">
                            <span className="text-slate-900">Work</span>
                            <span className="text-orange-500">play</span>
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 mb-1">
                            {isWorker ? 'Worker Portal' : 'Admin Portal'}
                        </h2>
                        <p className="text-slate-500 text-sm text-center">
                            Sign in to your {isWorker ? 'Worker' : 'Admin'} account.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 text-xs font-semibold text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
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

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 ${isWorker ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} rounded-xl text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign in to Portal <ArrowLeft className="rotate-180" size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 text-sm">
                        No account yet? <Link to={`/register/${role}`} className="text-indigo-600 font-bold hover:underline underline-offset-4">Sign up</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
