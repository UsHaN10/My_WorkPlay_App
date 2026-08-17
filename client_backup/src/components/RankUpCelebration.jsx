import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const RankUpCelebration = ({ newRank, onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    const getRankConfig = (rank) => {
        switch (rank) {
            case 'Diamond':
                return {
                    bgGradient: 'from-blue-900 via-cyan-800 to-blue-900',
                    lightColor: '#22d3ee',
                    particleColor: '#67e8f9',
                    textColor: 'text-cyan-100',
                    titleColor: 'text-cyan-50',
                    glowColor: 'rgba(34, 211, 238, 0.6)'
                };
            case 'Platiner':
                return {
                    bgGradient: 'from-indigo-900 via-purple-800 to-indigo-900',
                    lightColor: '#a78bfa',
                    particleColor: '#c4b5fd',
                    textColor: 'text-purple-100',
                    titleColor: 'text-purple-50',
                    glowColor: 'rgba(167, 139, 250, 0.6)'
                };
            case 'Gold':
                return {
                    bgGradient: 'from-amber-900 via-yellow-700 to-amber-900',
                    lightColor: '#fbbf24',
                    particleColor: '#fcd34d',
                    textColor: 'text-amber-100',
                    titleColor: 'text-amber-50',
                    glowColor: 'rgba(251, 191, 36, 0.6)'
                };
            case 'Silver':
                return {
                    bgGradient: 'from-slate-700 via-slate-500 to-slate-700',
                    lightColor: '#94a3b8',
                    particleColor: '#cbd5e1',
                    textColor: 'text-slate-100',
                    titleColor: 'text-slate-50',
                    glowColor: 'rgba(148, 163, 184, 0.6)'
                };
            case 'Bronze':
                return {
                    bgGradient: 'from-orange-900 via-orange-700 to-orange-900',
                    lightColor: '#fb923c',
                    particleColor: '#fdba74',
                    textColor: 'text-orange-100',
                    titleColor: 'text-orange-50',
                    glowColor: 'rgba(251, 146, 60, 0.6)'
                };
            default:
                return {
                    bgGradient: 'from-slate-800 via-slate-600 to-slate-800',
                    lightColor: '#94a3b8',
                    particleColor: '#cbd5e1',
                    textColor: 'text-slate-100',
                    titleColor: 'text-slate-50',
                    glowColor: 'rgba(148, 163, 184, 0.4)'
                };
        }
    };

    const config = getRankConfig(newRank);

    useEffect(() => {
        if (isVisible) {
            // Confetti burst
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: [config.lightColor, config.particleColor, '#ffffff']
            });

            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => {
                handleDismiss();
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
    };

    // Generate light ray elements
    const lightRays = Array.from({ length: 12 }, (_, i) => i);
    const particles = Array.from({ length: 30 }, (_, i) => i);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
                >
                    {/* Animated Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}>
                        {/* Animated Light Rays */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            {lightRays.map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 0.6, 0.3],
                                        scale: [0, 1.5, 1.8],
                                        rotate: [0, 360]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute w-[200%] h-2 origin-center"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${config.lightColor}, transparent)`,
                                        transform: `rotate(${i * 30}deg)`,
                                        filter: 'blur(2px)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Floating Particles */}
                        {particles.map((i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: window.innerHeight + 50,
                                    opacity: 0
                                }}
                                animate={{
                                    y: -50,
                                    opacity: [0, 1, 0],
                                    x: Math.random() * window.innerWidth
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "linear"
                                }}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    backgroundColor: config.particleColor,
                                    boxShadow: `0 0 10px ${config.lightColor}`
                                }}
                            />
                        ))}

                        {/* Diagonal Light Streaks */}
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                x: ['-100%', '200%']
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                background: `linear-gradient(135deg, transparent 40%, ${config.lightColor}40 50%, transparent 60%)`,
                                filter: 'blur(20px)'
                            }}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center px-6">
                        {/* Shield with Star */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 1, bounce: 0.4 }}
                            className="relative mb-8"
                        >
                            {/* Pulsing Glow */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 rounded-full blur-3xl"
                                style={{
                                    backgroundColor: config.glowColor,
                                    width: '200px',
                                    height: '200px',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />

                            {/* Shield Icon */}
                            <div className="relative">
                                <Shield
                                    size={120}
                                    className={`${config.textColor} drop-shadow-2xl`}
                                    strokeWidth={1.5}
                                    fill="currentColor"
                                    style={{
                                        filter: `drop-shadow(0 0 30px ${config.lightColor})`
                                    }}
                                />
                                {/* Star in center */}
                                <motion.div
                                    animate={{
                                        rotate: [0, 360],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                >
                                    <Star
                                        size={40}
                                        className="text-white drop-shadow-2xl"
                                        fill="white"
                                        style={{
                                            filter: `drop-shadow(0 0 20px ${config.lightColor})`
                                        }}
                                    />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Rank Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-center"
                        >
                            <h1
                                className={`text-8xl font-black ${config.titleColor} tracking-wider mb-4`}
                                style={{
                                    textShadow: `0 0 40px ${config.lightColor}, 0 0 80px ${config.lightColor}`,
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                {newRank.toUpperCase()}
                            </h1>

                            <motion.p
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`text-xl font-bold ${config.textColor} uppercase tracking-[0.3em]`}
                                style={{
                                    textShadow: `0 0 20px ${config.lightColor}`
                                }}
                            >
                                Rank Achieved
                            </motion.p>
                        </motion.div>

                        {/* Continue Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            onClick={handleDismiss}
                            className={`mt-12 px-12 py-4 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl ${config.titleColor} font-black text-lg uppercase tracking-widest hover:bg-white/30 transition-all shadow-2xl`}
                            style={{
                                boxShadow: `0 0 40px ${config.glowColor}`
                            }}
                        >
                            Continue
                        </motion.button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-8 right-8 p-3 text-white/60 hover:text-white transition-colors z-20"
                    >
                        <X size={24} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RankUpCelebration;
