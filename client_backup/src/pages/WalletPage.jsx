import React, { useEffect, useState } from 'react';
import { getTransactions, getUser, requestExchange, getExchangeRequests } from '../api';
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownLeft, Coins, Clock, Filter, RefreshCcw, ArrowRight, ChevronRight, Zap, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../SocketContext';
import { useCallback } from 'react';

const WalletPage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const [transactions, setTransactions] = useState([]);
    const [exchangeRequests, setExchangeRequests] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [filter, setFilter] = useState('all'); // 'all', 'earn', 'spend'
    const [exchangeAmount, setExchangeAmount] = useState('');
    const [isExchanging, setIsExchanging] = useState(false);
    const EXCHANGE_RATE = 10;

    const fetchData = useCallback(async () => {
        try {
            const [txs, reqs, userData] = await Promise.all([
                getTransactions(user.id),
                getExchangeRequests(user.id),
                getUser(user.id)
            ]);
            setTransactions(txs);
            setExchangeRequests(reqs);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
            console.error("Wallet fetch failed", err);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.on('MINT_UPDATE', fetchData);
            socket.on('TASK_UPDATE', fetchData);
        }
        return () => {
            if (socket) {
                socket.off('MINT_UPDATE', fetchData);
                socket.off('TASK_UPDATE', fetchData);
            }
        };
    }, [socket, fetchData]);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    const handleExchange = async (e) => {
        e.preventDefault();
        if (!exchangeAmount || exchangeAmount <= 0) return;
        if (exchangeAmount > user.coins) {
            alert("Insufficient WPC balance");
            return;
        }

        setIsExchanging(true);
        try {
            await requestExchange(user.id, Number(exchangeAmount));
            setExchangeAmount('');
            fetchData();
            alert(`Exchange request sent for ${exchangeAmount} WPC! Waiting for admin approval.`);
        } catch (err) {
            alert(err.response?.data?.error || "Exchange request failed");
        } finally {
            setIsExchanging(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-6 md:p-10 relative overflow-hidden">
            <main className="relative z-10 max-w-6xl mx-auto">
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
                                <Wallet className="text-indigo-600" size={32} /> My Wallet
                            </h1>
                            <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">Transaction Ledger & Credit Balance</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2rem] p-5 flex items-center gap-8 shadow-sm">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50">
                            <Coins className="text-amber-600" size={28} />
                        </div>
                        <div className="pr-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Credits</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{user.coins || 0} <span className="text-xs font-black text-slate-400 uppercase ml-1">WPC</span></div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Exchange Center */}
                    <div className="lg:col-span-12">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                        >
                            {/* Decorative elements */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 transition-all group-hover:scale-110" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50" />

                            <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <RefreshCcw size={20} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">EXCHANGE_HUB</h2>
                                    </div>
                                    <p className="text-slate-500 text-lg leading-relaxed mb-8 font-medium">
                                        Liquidate your <span className="text-amber-600 font-bold">Industrial Credits</span> into real-world currency. All exchanges are processed via verified company payroll protocols.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exchange Protocol</div>
                                            <div className="text-base font-black text-slate-900">1 WPC = 10 SLR</div>
                                        </div>
                                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2">Lead Time</div>
                                            <div className="text-base font-black text-emerald-600 flex items-center gap-2">
                                                <Zap size={16} /> INSTANT
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleExchange} className="w-full lg:max-w-sm bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Input Amount</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={exchangeAmount}
                                                onChange={(e) => setExchangeAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-16 text-xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">WPC</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                            <ArrowRight size={14} className="text-slate-300 rotate-90 xl:rotate-0" />
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settlement Quote</div>
                                        <div className="text-2xl font-black text-emerald-600">Rs. {exchangeAmount ? (exchangeAmount * EXCHANGE_RATE).toLocaleString() : '0'}</div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isExchanging || !exchangeAmount || exchangeAmount <= 0}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group/btn text-sm uppercase tracking-widest"
                                    >
                                        {isExchanging ? 'Processing Settlement...' : (
                                            <>
                                                Request Settlement <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Exchange Requests History */}
                            <div className="lg:col-span-12">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                        <Hourglass size={20} className="text-slate-400" /> Request Status
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {exchangeRequests.map(req => (
                                        <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-2xl font-black text-slate-900">{req.amount} <span className="text-xs text-slate-400 uppercase">WPC</span></div>
                                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                                    req.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {req.status === 'approved' && <CheckCircle size={12} />}
                                                    {req.status === 'rejected' && <XCircle size={12} />}
                                                    {req.status === 'pending' && <Clock size={12} />}
                                                    {req.status}
                                                </div>
                                            </div>
                                            {req.adminMessage && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        <span className="font-bold text-slate-900">Admin:</span> {req.adminMessage}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {exchangeRequests.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                                            No active exchange requests directly.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Activity Header */}
                    <div className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Financial Stream</h3>
                        </div>

                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            {['all', 'earn', 'spend'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? (f === 'spend' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100') : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="lg:col-span-12 space-y-3 pb-24">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={tx.id}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between group hover:border-indigo-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${tx.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {tx.type === 'earn' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-0.5 text-sm md:text-base tracking-tight">{tx.reason}</h4>
                                            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className={`text-lg md:text-xl font-black tabular-nums ${tx.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.type === 'earn' ? '+' : '-'}{tx.amount} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Credits</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-100">
                                    <Filter size={32} />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Transaction silence</h3>
                                <p className="text-xs text-slate-400 mt-2 font-medium">Earn credits by completing active industrial tasks.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WalletPage;
