// --- SESSION SLOT AND CNS CONTROL COMPONENTS ---

const SessionSlot = ({ session, label, onClick, icon, onDragStart, onDrop, onDragOver }) => {
    const { calculateWorkoutStats, getSessionColorClass } = window.SportPlanner.Utils;
    const Icons = window.SportPlanner.Icons;

    const isEmpty = !session.type;
    const structureText = session.exercises?.length > 0 ? `${session.exercises.length} exercises` : null;
    const stats = calculateWorkoutStats(session);

    const renderRunningSummary = () => {
        if (!session.workoutStructure) return null;
        const validSteps = session.workoutStructure.filter(comp => comp.type !== 'W-up' && comp.type !== 'C-down');

        if (validSteps.length === 0) return null;

        return (
            <div className="mt-1 space-y-0.5">
                {validSteps.map((comp, i) => {
                    const formatStep = (s) => {
                        const dur = s.durationType === 'Distance' ? `${s.durationValue}km` : `${s.durationValue}`;
                        const int = s.intensityType === 'Pace' ? `@${s.intensityValue}` : s.intensityType === 'Heart Rate' ? `HR ${s.intensityValue}` : '';
                        return `${dur} ${int}`;
                    };

                    if (comp.isRepeat) {
                        const runPart = comp.steps.find(s => s.type === 'Run') || comp.steps[0];
                        const recPart = comp.steps.find(s => s.type === 'Recovery' || s.type === 'Rest');
                        const recStr = recPart ? `'${recPart.durationValue}` : '';
                        return (
                            <div key={comp.id || i} className="text-[10px] leading-3 text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                <span className="font-bold text-blue-600">{comp.repeats}x</span> {formatStep(runPart)} <span className="text-gray-400 text-[9px]">{recStr}</span>
                            </div>
                        );
                    } else {
                        if (comp.type === 'Recovery' || comp.type === 'Rest') return null;
                        return (
                            <div key={comp.id || i} className="text-[10px] leading-3 text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                {formatStep(comp)}
                            </div>
                        );
                    }
                })}
            </div>
        )
    };

    return (
        <div onClick={onClick} draggable={!isEmpty} onDragStart={onDragStart} onDrop={onDrop} onDragOver={onDragOver} className={`group cursor-pointer rounded-lg p-3 border transition-all duration-200 h-full flex flex-col gap-1 ${getSessionColorClass(session.type)} ${isEmpty ? 'opacity-60 hover:opacity-100' : 'shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-center py-1"><div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider"><span className="shrink-0">{icon}</span><span>{label}</span></div><div className="flex items-center gap-2 shrink-0">{session.time && (<span className="text-[11px] font-semibold text-gray-600">{session.time}</span>)}{!session.type?.includes('Gym') && session.rpe && (<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${session.rpe > 8 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>RPE {session.rpe}</span>)}</div></div>
            <div className="flex-1 flex flex-col justify-start">
                {isEmpty ? (<div className="py-4 flex items-center justify-center"><span className="text-2xl text-gray-300 group-hover:text-gray-400 font-light">+</span></div>) : (<><p className="font-bold text-gray-800 text-sm break-words">{session.type}</p><p className="text-xs text-gray-600 break-words">{session.subType || 'General'} {session.periodization && <span className="text-gray-400"> | {session.periodization}</span>}</p>
                    {stats.totalDist > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 rounded">{stats.totalDist} km</span>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 rounded">{stats.totalTime} min</span>
                        </div>
                    )}

                    {session.type === 'Running' ? renderRunningSummary() : (structureText && !stats.totalDist && <p className="text-[10px] text-blue-600 mt-1 font-medium">{structureText}</p>)}

                    {session.notes && (<p className={`text-xs text-gray-500 mt-2 border-t border-black/5 pt-1 italic whitespace-pre-wrap break-words line-clamp-2`}>"{session.notes}"</p>)}</>)}
            </div>
        </div>
    );
};

const CNSControl = ({ level, onChange }) => {
    const Icons = window.SportPlanner.Icons;

    return (
        <div className="bg-slate-50 border-t border-gray-100 p-2 mt-auto"><div className="flex items-center gap-2 mb-2 px-1"><div className="p-0.5 bg-slate-100 rounded"><Icons.Zap size={14} className="text-slate-500" /></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CNS Fatigue</span></div><div className="flex gap-1"><button onClick={() => onChange(level === 'Low' ? null : 'Low')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors border ${level === 'Low' ? 'bg-green-100 text-green-700 border-green-200 ring-1 ring-green-400' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>Low</button><button onClick={() => onChange(level === 'Medium' ? null : 'Medium')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors border ${level === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200 ring-1 ring-orange-400' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>Med</button><button onClick={() => onChange(level === 'High' ? null : 'High')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors border ${level === 'High' ? 'bg-red-100 text-red-700 border-red-200 ring-1 ring-red-400' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>High</button></div></div>
    );
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.Sessions = {
    SessionSlot,
    CNSControl
};
