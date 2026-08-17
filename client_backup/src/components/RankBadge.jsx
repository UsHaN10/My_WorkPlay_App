import React from 'react';
import { Shield, Award, Zap, Trophy, Crown, Star, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RankBadge = ({ rank, size = 24, showLabel = false, className = "" }) => {
    const getRankConfig = (rankName = "") => {
        const logoPath = (name) => `RankingLogo/${name}.png?v=1`;
        const normalizedRank = rankName.toLowerCase();

        switch (normalizedRank) {
            case 'diamond':
                return {
                    img: logoPath('diamond'),
                    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
                    shadow: 'shadow-cyan-400/40',
                    labelColor: 'text-cyan-600',
                    border: 'border-cyan-200',
                    glow: 'cyan',
                    animate: true
                };
            case 'platiner':
                return {
                    img: logoPath('platiner'),
                    gradient: 'from-indigo-400 via-violet-500 to-fuchsia-600',
                    shadow: 'shadow-violet-400/40',
                    labelColor: 'text-violet-600',
                    border: 'border-violet-200',
                    glow: 'violet',
                    animate: true
                };
            case 'gold':
                return {
                    img: logoPath('gold'),
                    gradient: 'from-yellow-300 via-amber-500 to-orange-600',
                    shadow: 'shadow-amber-400/40',
                    labelColor: 'text-amber-600',
                    border: 'border-amber-200',
                    glow: 'amber',
                    animate: false
                };
            case 'silver':
                return {
                    img: logoPath('silver'),
                    gradient: 'from-slate-300 via-slate-400 to-slate-600',
                    shadow: 'shadow-slate-400/40',
                    labelColor: 'text-slate-600',
                    border: 'border-slate-300',
                    animate: false
                };
            case 'bronze':
                return {
                    img: logoPath('bronze'),
                    gradient: 'from-orange-300 via-orange-500 to-orange-700',
                    shadow: 'shadow-orange-400/40',
                    labelColor: 'text-orange-600',
                    border: 'border-orange-200',
                    animate: false
                };
            default:
                return {
                    icon: <HelpCircle size={size * 0.8} />,
                    gradient: 'from-slate-400 to-slate-600',
                    shadow: 'shadow-slate-200/40',
                    labelColor: 'text-slate-400',
                    border: 'border-slate-200',
                    animate: false
                };
        }
    };

    const config = getRankConfig(rank);

    const glowStyles = {
        cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',
        violet: 'shadow-[0_0_15px_rgba(139,92,246,0.4)]',
        amber: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <motion.div
                animate={config.animate ? {
                    boxShadow: [
                        `0 0 10px ${config.glow === 'cyan' ? 'rgba(34,211,238,0.3)' : 'rgba(139,92,246,0.2)'}`,
                        `0 0 25px ${config.glow === 'cyan' ? 'rgba(34,211,238,0.6)' : 'rgba(139,92,246,0.5)'}`,
                        `0 0 10px ${config.glow === 'cyan' ? 'rgba(34,211,238,0.3)' : 'rgba(139,92,246,0.2)'}`
                    ]
                } : {}}
                transition={{ duration: 3, repeat: Infinity }}
                className={`relative flex items-center justify-center rounded-2xl overflow-visible shadow-2xl ${config.shadow} ${config.glow ? glowStyles[config.glow] : ''} bg-white/20 backdrop-blur-md border-2 ${config.border} p-1`}
                style={{
                    width: size * 1.8,
                    height: size * 1.8,
                }}
            >
                {/* Glossy Overlay & Shimmer for Diamond */}
                {config.glow === 'cyan' && (
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl pointer-events-none" />

                {config.img ? (
                    <img
                        src={config.img}
                        alt={rank}
                        className={`w-full h-full object-contain filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] ${config.glow === 'cyan' ? 'brightness-110' : ''}`}
                        onError={(e) => {
                            console.warn(`Failed to load rank logo: ${config.img}`);
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.gradient} text-white rounded-xl shadow-inner`}>
                        {config.icon}
                    </div>
                )}
            </motion.div>
            {showLabel && (
                <div className="flex flex-col leading-none">
                    <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${config.labelColor} drop-shadow-sm ${config.glow === 'cyan' ? 'animate-pulse' : ''}`}>
                        {rank}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-80">
                        {config.glow === 'cyan' ? 'ULTIMATE RATING' : 'Tier Rating'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RankBadge;
