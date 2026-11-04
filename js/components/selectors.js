// --- SELECTOR COMPONENTS ---
const { useState } = React;

const TimeSelector = ({ value, onChange, className }) => {
    const [mins, secs] = value && value.includes(':') ? value.split(':') : ['', ''];
    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            <select value={mins} onChange={(e) => onChange(`${e.target.value}:${secs || '00'}`)} className="bg-gray-50 border border-gray-300 rounded text-sm py-1 px-1 outline-none w-1/2">
                <option value="">-</option>
                {[...Array(60)].map((_, i) => <option key={i} value={i.toString()}>{i}'</option>)}
            </select>
            <span className="text-gray-500">:</span>
            <select value={secs} onChange={(e) => onChange(`${mins || '0'}:${e.target.value}`)} className="bg-gray-50 border border-gray-300 rounded text-sm py-1 px-1 outline-none w-1/2">
                <option value="">-</option>
                {[...Array(60)].map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}"</option>)}
            </select>
        </div>
    );
};

const DistanceSelector = ({ value, onChange, className }) => {
    const [km, m] = value && value.includes('.') ? value.split('.') : ['', ''];
    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            <select value={km} onChange={(e) => onChange(`${e.target.value}.${m || '0'}`)} className="bg-gray-50 border border-gray-300 rounded text-sm py-1 px-1 outline-none w-1/2">
                <option value="">-</option>
                {[...Array(61)].map((_, i) => <option key={i} value={i.toString()}>{i}</option>)}
            </select>
            <span className="text-gray-500">.</span>
            <select value={m} onChange={(e) => onChange(`${km || '0'}.${e.target.value}`)} className="bg-gray-50 border border-gray-300 rounded text-sm py-1 px-1 outline-none w-1/2">
                <option value="">-</option>
                {[...Array(10)].map((_, i) => <option key={i} value={i.toString()}>{i}</option>)}
            </select>
        </div>
    )
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.Selectors = {
    TimeSelector,
    DistanceSelector
};
