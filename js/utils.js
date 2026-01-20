// --- UTILITY FUNCTIONS ---

const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const toISODate = (date) => date.toISOString().split('T')[0];

const getMondayDate = (inputDate) => {
    const d = new Date(inputDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const getDefaultStartDate = () => toISODate(getMondayDate(new Date()));

const createEmptyDay = (dateObj) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
        dayName: days[dateObj.getDay()],
        date: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        cnsFatigue: null,
        status: 'neutral',
        dailyNotes: '',
        training1: { id: `t1-${dateObj.getTime()}`, type: null, subType: '', notes: '', time: '' },
        training2: { id: `t2-${dateObj.getTime()}`, type: null, subType: '', notes: '', time: '' },
    };
};

const calculateWorkoutStats = (session) => {
    if (session.type !== 'Running' && session.type !== 'Cycling') return { totalDist: 0, totalTime: 0 };
    if (!session.workoutStructure) return { totalDist: 0, totalTime: 0 };

    let totalDist = 0;
    let totalTime = 0;

    const parsePace = (str) => {
        if (!str || !str.includes(':')) return 0;
        const [m, s] = str.split(':').map(Number);
        return m + s / 60;
    };
    const parseTime = (str) => {
        if (!str || !str.includes(':')) return 0;
        const [m, s] = str.split(':').map(Number);
        return m + s / 60;
    };
    const processStep = (step, mult = 1) => {
        const pace = parsePace(step.intensityType === 'Pace' ? step.intensityValue : '0:0');
        if (step.durationType === 'Distance') {
            const dist = parseFloat(step.durationValue) || 0;
            totalDist += dist * mult;
            if (pace > 0) totalTime += (dist * pace) * mult;
        } else {
            const time = parseTime(step.durationValue);
            totalTime += time * mult;
            if (pace > 0) totalDist += (time / pace) * mult;
        }
    };
    session.workoutStructure.forEach(comp => {
        if (comp.isRepeat) comp.steps.forEach(s => processStep(s, comp.repeats));
        else processStep(comp);
    });
    return { totalDist: totalDist.toFixed(1), totalTime: Math.round(totalTime) };
};

const getSupersetColor = (supersetId) => {
    const { SUPERSET_COLORS } = window.SportPlanner.Constants;
    if (!supersetId) return SUPERSET_COLORS[0];
    const index = (supersetId.charCodeAt(0) - 65);
    return SUPERSET_COLORS[index % SUPERSET_COLORS.length] || SUPERSET_COLORS[0];
};

// Type badge colors for monthly view
const getTypeBadge = (type) => {
    switch (type) {
        case 'Gym': return 'bg-indigo-100 text-indigo-700';
        case 'Running': return 'bg-orange-100 text-orange-700';
        case 'Cycling': return 'bg-cyan-100 text-cyan-700';
        case 'Football': return 'bg-green-100 text-green-700';
        case 'Rest': return 'bg-purple-100 text-purple-700';
        default: return 'bg-white text-gray-700 border border-gray-200';
    }
};

// Small solid color dot for totals panel
const getTypeDot = (type) => {
    switch (type) {
        case 'Gym': return 'bg-indigo-500';
        case 'Running': return 'bg-orange-500';
        case 'Cycling': return 'bg-cyan-500';
        case 'Football': return 'bg-green-500';
        case 'Rest': return 'bg-purple-500';
        default: return 'bg-gray-300';
    }
};

// Format monthly label: prefer subType and append a short suffix for clarity
const formatMonthlyLabel = (s) => {
    if (!s || !s.type) return '';
    const sub = (s.subType || '').trim();
    if (sub) {
        const lc = sub.toLowerCase();
        const needsRun = s.type === 'Running' && !lc.includes('run');
        const needsRide = s.type === 'Cycling' && !lc.includes('ride');
        const suffix = needsRun ? ' run' : needsRide ? ' ride' : '';
        return `${sub}${suffix}`;
    }
    return s.type;
};

// Session slot color class
const getSessionColorClass = (type) => {
    switch (type) {
        case 'Gym': return 'bg-indigo-50 border-indigo-200 hover:border-indigo-300';
        case 'Running': return 'bg-orange-50 border-orange-200 hover:border-orange-300';
        case 'Cycling': return 'bg-cyan-50 border-cyan-200 hover:border-cyan-300';
        case 'Football': return 'bg-green-50 border-green-200 hover:border-green-300';
        case 'Rest': return 'bg-purple-50 border-purple-200 hover:border-purple-300';
        default: return 'bg-white border-gray-200 border-dashed hover:border-gray-400';
    }
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.Utils = {
    uid,
    getWeekNumber,
    toISODate,
    getMondayDate,
    getDefaultStartDate,
    createEmptyDay,
    calculateWorkoutStats,
    getSupersetColor,
    getTypeBadge,
    getTypeDot,
    formatMonthlyLabel,
    getSessionColorClass
};
