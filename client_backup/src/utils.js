export const getRankStyles = (rank) => {
    switch (rank) {
        case 'Diamond': return 'bg-cyan-50/50 text-cyan-600 border-cyan-100 shadow-xl shadow-cyan-100/20 backdrop-blur-md';
        case 'Platiner': return 'bg-indigo-50/50 text-indigo-600 border-indigo-100 shadow-xl shadow-indigo-100/20 backdrop-blur-md';
        case 'Gold': return 'bg-amber-50/50 text-amber-600 border-amber-100 shadow-xl shadow-amber-100/20 backdrop-blur-md';
        case 'Silver': return 'bg-slate-100/50 text-slate-600 border-slate-200 shadow-xl shadow-slate-200/20 backdrop-blur-md';
        case 'Bronze': return 'bg-orange-50/50 text-orange-600 border-orange-100 shadow-xl shadow-orange-100/20 backdrop-blur-md';
        default: return 'bg-slate-50/50 text-slate-400 border-slate-100';
    }
};

export const getRankColor = (rank) => {
    switch (rank) {
        case 'Diamond': return 'text-cyan-500';
        case 'Platiner': return 'text-indigo-500';
        case 'Gold': return 'text-amber-500';
        case 'Silver': return 'text-slate-500';
        case 'Bronze': return 'text-orange-500';
        default: return 'text-slate-400';
    }
};

export const getRankBg = (rank) => {
    switch (rank) {
        case 'Diamond': return 'bg-cyan-500';
        case 'Platiner': return 'bg-indigo-500';
        case 'Gold': return 'bg-amber-500';
        case 'Silver': return 'bg-slate-500';
        case 'Bronze': return 'bg-orange-500';
        default: return 'bg-slate-400';
    }
};

export const getNextRankXp = (rank) => {
    switch (rank) {
        case 'Novice': return 100;
        case 'Bronze': return 500;
        case 'Silver': return 1000;
        case 'Gold': return 3000;
        case 'Platiner': return 5000;
        case 'Diamond': return 10000;
        default: return 100;
    }
};
export const getRankGlow = (rank) => {
    switch (rank) {
        case 'Diamond': return 'rgba(34, 211, 238, 0.7)'; // Intense Cyan
        case 'Platiner': return 'rgba(139, 92, 246, 0.6)'; // Intense Purple
        case 'Gold': return 'rgba(245, 158, 11, 0.5)'; // Amber
        case 'Silver': return 'rgba(148, 163, 184, 0.4)'; // Slate
        case 'Bronze': return 'rgba(234, 88, 12, 0.3)'; // Orange
        default: return 'rgba(100, 116, 139, 0.2)';
    }
};
