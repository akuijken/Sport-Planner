// --- MODAL COMPONENTS ---
const { useState, useEffect } = React;

const PeriodizationModal = ({ isOpen, onClose, onSelect, currentPhase }) => {
    const { PERIODIZATION_OPTIONS } = window.SportPlanner.Constants;
    const Icons = window.SportPlanner.Icons;

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="bg-slate-800 p-4 flex justify-between items-center">
                    <h3 className="text-white font-semibold">Select Week Phase</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icons.X size={20} /></button>
                </div>
                <div className="p-2 grid grid-cols-1 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                    {PERIODIZATION_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => onSelect(opt)} className={`p-3 text-left hover:bg-blue-50 transition-colors text-sm font-medium ${currentPhase === opt ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>{opt}</button>
                    ))}
                    <button onClick={() => onSelect('')} className="p-3 text-left hover:bg-red-50 text-red-600 transition-colors text-sm font-medium">Clear Phase</button>
                </div>
            </div>
        </div>
    );
};

const TrainingModal = ({ isOpen, onClose, onSave, session, title, onCopy, onPaste, canPaste, fitnessData }) => {
    const { TRAINING_TYPES, SUB_TYPES, SUPERSET_LETTERS, RUNNING_STEP_TYPES } = window.SportPlanner.Constants;
    const { uid, calculateWorkoutStats, getSupersetColor } = window.SportPlanner.Utils;
    const { TimeSelector, DistanceSelector } = window.SportPlanner.Selectors;
    const Icons = window.SportPlanner.Icons;

    const [editedSession, setEditedSession] = useState(session);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const safeSession = JSON.parse(JSON.stringify(session));

        // Initialize arrays if missing
        if (safeSession.type === 'Gym' && !safeSession.exercises) safeSession.exercises = [];
        if (safeSession.type === 'Running' && !safeSession.workoutStructure) safeSession.workoutStructure = [];

        setEditedSession(safeSession);

        // Default to Summary view if data exists, else Edit view
        const hasGymData = safeSession.type === 'Gym' && safeSession.exercises && safeSession.exercises.length > 0;
        const hasRunData = safeSession.type === 'Running' && safeSession.workoutStructure && safeSession.workoutStructure.length > 0;
        setIsEditing(!(hasGymData || hasRunData));

    }, [session, isOpen]);

    if (!isOpen) return null;

    // --- Handlers ---
    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setEditedSession({
            ...editedSession,
            type: newType || null,
            subType: '',
            exercises: newType === 'Gym' ? [] : undefined,
            workoutStructure: newType === 'Running' ? [] : undefined
        });
        setIsEditing(true); // Always edit when changing type
    };

    const handleClear = () => {
        setEditedSession({ ...editedSession, type: null, subType: '', periodization: '', time: '', notes: '', rpe: undefined, exercises: undefined, workoutStructure: undefined });
        setIsEditing(true);
    }

    const handlePasteAction = () => {
        if (onPaste) {
            const pasted = onPaste();
            if (pasted) {
                const newExercises = pasted.exercises?.map(ex => ({ ...ex, id: uid() })) || [];
                const newStructure = pasted.workoutStructure ? JSON.parse(JSON.stringify(pasted.workoutStructure)) : [];
                setEditedSession({ ...editedSession, type: pasted.type, subType: pasted.subType, periodization: pasted.periodization, notes: pasted.notes, exercises: newExercises, workoutStructure: newStructure, rpe: pasted.rpe, time: pasted.time });
                setIsEditing(false); // Go to summary after paste
            }
        }
    };

    // --- Gym Builders ---
    const addExercise = (supersetId) => {
        const newExercise = { id: uid(), name: '', weight: '', sets: 3, reps: '10', rpe: '-', supersetId: supersetId || 'A' };
        let newExercises = [...(editedSession.exercises || [])];
        if (supersetId) {
            let insertIndex = -1;
            for (let i = newExercises.length - 1; i >= 0; i--) { if (newExercises[i].supersetId === supersetId) { insertIndex = i; break; } }
            if (insertIndex >= 0) newExercises.splice(insertIndex + 1, 0, newExercise); else newExercises.push(newExercise);
        } else { newExercises.push(newExercise); }
        if (!supersetId) newExercises.sort((a, b) => (a.supersetId || 'A').localeCompare(b.supersetId || 'A'));
        setEditedSession({ ...editedSession, exercises: newExercises });
    };
    const updateSupersetGroup = (id, newGroup) => {
        const updated = editedSession.exercises.map(ex => ex.id === id ? { ...ex, supersetId: newGroup } : ex);
        updated.sort((a, b) => (a.supersetId || 'A').localeCompare(b.supersetId || 'A'));
        setEditedSession({ ...editedSession, exercises: updated });
    };
    const updateExercise = (id, field, value) => setEditedSession({ ...editedSession, exercises: editedSession.exercises?.map(ex => ex.id === id ? { ...ex, [field]: value } : ex) });
    const removeExercise = (id) => setEditedSession({ ...editedSession, exercises: editedSession.exercises?.filter(ex => ex.id !== id) });
    const moveExercise = (index, direction) => {
        if (!editedSession.exercises) return;
        const newExercises = [...editedSession.exercises];
        if (direction === 'up' && index > 0) [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
        else if (direction === 'down' && index < newExercises.length - 1) [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
        setEditedSession({ ...editedSession, exercises: newExercises });
    };

    // --- Running Builders ---
    const addRunStep = () => setEditedSession(prev => ({ ...prev, workoutStructure: [...(prev.workoutStructure || []), { id: uid(), type: 'Run', durationType: 'Distance', durationValue: '1.0', intensityType: 'Pace', intensityValue: '' }] }));
    const addRepeatBlock = () => setEditedSession(prev => ({ ...prev, workoutStructure: [...(prev.workoutStructure || []), { id: uid(), isRepeat: true, repeats: 2, steps: [{ id: uid(), type: 'Run', durationType: 'Distance', durationValue: '1.0', intensityType: 'Pace', intensityValue: '' }] }] }));
    const updateRunComponent = (id, field, value, parentId) => {
        const newStructure = [...(editedSession.workoutStructure || [])];
        const updateStep = (step) => ({ ...step, [field]: value });
        if (parentId) {
            const blockIndex = newStructure.findIndex(c => c.id === parentId);
            if (blockIndex >= 0) newStructure[blockIndex].steps = newStructure[blockIndex].steps.map(s => s.id === id ? updateStep(s) : s);
        } else {
            const index = newStructure.findIndex(c => c.id === id);
            if (index >= 0) { if (newStructure[index].isRepeat) newStructure[index][field] = value; else newStructure[index] = updateStep(newStructure[index]); }
        }
        setEditedSession({ ...editedSession, workoutStructure: newStructure });
    };
    const removeRunComponent = (id, parentId) => {
        let newStructure = [...(editedSession.workoutStructure || [])];
        if (parentId) {
            const blockIndex = newStructure.findIndex(c => c.id === parentId);
            if (blockIndex >= 0) newStructure[blockIndex].steps = newStructure[blockIndex].steps.filter(s => s.id !== id);
        } else newStructure = newStructure.filter(c => c.id !== id);
        setEditedSession({ ...editedSession, workoutStructure: newStructure });
    };
    const moveRunComponent = (id, direction, parentId) => {
        const newStructure = [...(editedSession.workoutStructure || [])];
        if (parentId) {
            const blockIndex = newStructure.findIndex(c => c.id === parentId);
            if (blockIndex === -1) return;
            const block = { ...newStructure[blockIndex] };
            const steps = [...block.steps];
            const stepIndex = steps.findIndex(s => s.id === id);
            if (stepIndex === -1) return;
            if (direction === 'up' && stepIndex > 0) [steps[stepIndex], steps[stepIndex - 1]] = [steps[stepIndex - 1], steps[stepIndex]];
            else if (direction === 'down' && stepIndex < steps.length - 1) [steps[stepIndex], steps[stepIndex + 1]] = [steps[stepIndex + 1], steps[stepIndex]];
            block.steps = steps;
            newStructure[blockIndex] = block;
        } else {
            const index = newStructure.findIndex(c => c.id === id);
            if (index === -1) return;
            if (direction === 'up' && index > 0) [newStructure[index], newStructure[index - 1]] = [newStructure[index - 1], newStructure[index]];
            else if (direction === 'down' && index < newStructure.length - 1) [newStructure[index], newStructure[index + 1]] = [newStructure[index + 1], newStructure[index]];
        }
        setEditedSession({ ...editedSession, workoutStructure: newStructure });
    };
    const addStepToBlock = (blockId) => {
        const newStructure = [...(editedSession.workoutStructure || [])];
        const block = newStructure.find(c => c.id === blockId);
        if (block) { block.steps.push({ id: uid(), type: 'Recovery', durationType: 'Time', durationValue: '02:00', intensityType: 'None', intensityValue: '' }); setEditedSession({ ...editedSession, workoutStructure: newStructure }); }
    };

    const isGym = editedSession.type === 'Gym';
    const isRunning = editedSession.type === 'Running';
    const totals = calculateWorkoutStats(editedSession);
    const availableSubTypes = editedSession.type && SUB_TYPES[editedSession.type] ? SUB_TYPES[editedSession.type] : [];
    const dbList = fitnessData.exerciseDatabase || [];
    const runningPresets = ['lt1', 'lt2', 'vo2'].map(k => fitnessData.running?.[k]?.paceOrPower).filter(Boolean);
    const hrPresets = ['lt1', 'lt2', 'vo2'].map(k => fitnessData.running?.[k]?.hr).filter(Boolean);

    // --- SUMMARY COMPONENTS ---
    const GymSummary = ({ exercises }) => (
        <div className="space-y-1">
            {exercises.map((ex, i) => {
                const bgClass = getSupersetColor(ex.supersetId || 'A');
                return (
                    <div key={ex.id} className={`flex items-center text-sm p-2 rounded border border-black/5 ${bgClass}`}>
                        <span className="font-bold w-6 text-gray-600">{ex.supersetId}.</span>
                        <span className="flex-1 font-medium text-gray-800">{ex.name || 'Unknown Exercise'}</span>
                        <span className="w-16 text-right text-gray-600 font-mono text-xs">{ex.sets}x{ex.reps}</span>
                        <span className="w-12 text-right font-bold text-gray-700 text-xs">{ex.weight}kg</span>
                    </div>
                );
            })}
        </div>
    );

    const RunningSummary = ({ structure }) => (
        <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
            {structure.map(comp => {
                const formatStep = (s) => {
                    const dur = s.durationType === 'Distance' ? `${s.durationValue}km` : `${s.durationValue}`;
                    const int = s.intensityType === 'Pace' ? `@${s.intensityValue}` : s.intensityType === 'Heart Rate' ? `HR ${s.intensityValue}` : '';
                    return `${dur} ${int}`;
                };

                if (comp.isRepeat) {
                    // Assumes repeats usually have a run part and a recovery part
                    const runPart = comp.steps.find(s => s.type === 'Run') || comp.steps[0];
                    const recPart = comp.steps.find(s => s.type === 'Recovery' || s.type === 'Rest');
                    const recStr = recPart ? `'${formatStep(recPart)}` : '';

                    return (
                        <div key={comp.id} className="font-medium text-gray-800 py-1">
                            <span className="font-bold text-blue-600">{comp.repeats}x</span> {formatStep(runPart)} <span className="text-gray-500 text-xs">{recStr}</span>
                        </div>
                    );
                } else {
                    const prefix = (comp.type === 'W-up' || comp.type === 'C-down') ? <span className="font-bold text-gray-500 mr-1">{comp.type}:</span> : null;
                    if (comp.type === 'Recovery' || comp.type === 'Rest') return null; // Don't show standalone recovery in summary unless specific
                    return (
                        <div key={comp.id} className="py-1 flex items-center">
                            {prefix} <span>{formatStep(comp)}</span>
                        </div>
                    );
                }
            })}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <datalist id="exercise-list">{dbList.map((ex, i) => <option key={i} value={ex} />)}</datalist>
            <datalist id="pace-presets">{runningPresets.map((p, i) => <option key={i} value={p}>Zone {i + 1}</option>)}</datalist>
            <datalist id="hr-presets">{hrPresets.map((h, i) => <option key={i} value={h}>Zone {i + 1} HR</option>)}</datalist>

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
                    <h2 className="text-white font-semibold text-lg">{title}</h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (editedSession.type === 'Gym' || editedSession.type === 'Running') && (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition mr-2 shadow-sm">
                                <Icons.Edit size={16} /> Open Editor
                            </button>
                        )}
                        {onCopy && editedSession.type && <button onClick={() => onCopy(editedSession)} className="text-gray-300 hover:text-white"><Icons.Copy size={20} /></button>}
                        {canPaste && <button onClick={handlePasteAction} className="text-gray-300 hover:text-white"><Icons.Clipboard size={20} /></button>}
                        <button onClick={onClose} className="text-gray-300 hover:text-white ml-2"><Icons.X size={24} /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Sport</label><select value={editedSession.type || ''} onChange={handleTypeChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"><option value="">Select Sport...</option>{TRAINING_TYPES.map(t => <option key={t} value={t || ''}>{t}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><div className="relative"><input type="time" value={editedSession.time || ''} onChange={(e) => setEditedSession({ ...editedSession, time: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 pl-9 outline-none" /><Icons.Clock className="absolute left-3 top-3 text-gray-400 w-4 h-4" /></div></div>
                    </div>

                    {editedSession.type && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <input list="subtype-options" type="text" value={editedSession.subType} onChange={(e) => setEditedSession({ ...editedSession, subType: e.target.value })} placeholder="Select or type..." className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" />
                                <datalist id="subtype-options">{availableSubTypes.map(st => <option key={st} value={st} />)}</datalist>
                            </div>
                        </div>
                    )}

                    {/* --- CONTENT AREA (TOGGLES BETWEEN SUMMARY AND EDITOR) --- */}

                    {/* GYM CONTENT */}
                    {isGym && (
                        !isEditing ? (
                            <GymSummary exercises={editedSession.exercises} />
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Exercises</h3><button onClick={() => addExercise()} className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"><Icons.Plus size={14} /> Add</button></div>
                                <div className="space-y-2">
                                    {editedSession.exercises?.length > 0 && (<div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-2"><div className="col-span-1"></div><div className="col-span-1 text-center">#</div><div className="col-span-3">Exercise</div><div className="col-span-2">Kg</div><div className="col-span-2 text-center">Sets</div><div className="col-span-1 text-center">Reps</div><div className="col-span-1 text-center">RPE</div><div className="col-span-1"></div></div>)}
                                    {editedSession.exercises?.map((ex, idx) => {
                                        const bgClass = getSupersetColor(ex.supersetId || 'A');
                                        return (
                                            <div key={ex.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded border shadow-sm ${bgClass}`}>
                                                <div className="col-span-1 flex flex-col items-center justify-center gap-0.5"><button onClick={() => moveExercise(idx, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronUp size={14} /></button><button onClick={() => moveExercise(idx, 'down')} disabled={idx === (editedSession.exercises?.length || 0) - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronDown size={14} /></button></div>

                                                <div className="col-span-1 flex justify-center">
                                                    <select value={ex.supersetId || 'A'} onChange={(e) => updateSupersetGroup(ex.id, e.target.value)} className="text-sm font-bold text-slate-700 bg-white/50 border border-black/10 rounded px-1 py-1 outline-none cursor-pointer hover:bg-white">
                                                        {SUPERSET_LETTERS.map(l => (<option key={l} value={l}>{l}.</option>))}
                                                    </select>
                                                </div>

                                                <div className="col-span-3"><input list="exercise-list" type="text" placeholder="Name" value={ex.name} onChange={(e) => updateExercise(ex.id, 'name', e.target.value)} className="w-full text-sm border-gray-400/30 border-b bg-transparent focus:border-blue-500 outline-none pb-1" /></div>
                                                <div className="col-span-2"><input type="text" placeholder="kg" value={ex.weight || ''} onChange={(e) => updateExercise(ex.id, 'weight', e.target.value)} className="w-full text-sm border-gray-400/30 border-b bg-transparent focus:border-blue-500 outline-none pb-1" /></div>
                                                <div className="col-span-2"><select value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value))} className="w-full text-sm text-center bg-transparent border-b border-gray-400/30 outline-none">{[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></div>
                                                <div className="col-span-1"><input type="text" value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)} className="w-full text-sm text-center border-gray-400/30 border-b bg-transparent focus:border-blue-500 outline-none pb-1" placeholder="10" /></div>
                                                <div className="col-span-1"><select value={ex.rpe} onChange={(e) => updateExercise(ex.id, 'rpe', e.target.value)} className="w-full text-sm text-center font-bold text-blue-600 bg-transparent border-b border-gray-400/30 outline-none"><option value="-">-</option>{[...Array(10)].map((_, i) => <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>)}</select></div>
                                                <div className="col-span-1 flex justify-end"><button onClick={() => removeExercise(ex.id)} className="text-gray-400 hover:text-red-500"><Icons.Minus size={16} /></button></div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    )}

                    {/* RUNNING CONTENT */}
                    {isRunning && (
                        !isEditing ? (
                            <RunningSummary structure={editedSession.workoutStructure} />
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4"><h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Workout Builder</h3><div className="flex gap-3 text-xs text-gray-500 font-medium"><span className="flex items-center gap-1"><Icons.Ruler size={12} /> {totals.totalDist} km</span><span className="flex items-center gap-1"><Icons.Timer size={12} /> ~{totals.totalTime} min</span></div></div>
                                    <div className="flex gap-2"><button onClick={addRepeatBlock} className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition"><Icons.Repeat size={14} /> Add Repeats</button><button onClick={addRunStep} className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"><Icons.Plus size={14} /> Add Step</button></div>
                                </div>
                                <div className="space-y-3">
                                    {editedSession.workoutStructure?.map((comp, idx) => (
                                        comp.isRepeat ? (
                                            <div key={comp.id} className="border-2 border-purple-100 rounded-lg p-3 bg-white">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-50">
                                                    <div className="flex flex-col items-center justify-center gap-0.5"><button onClick={() => moveRunComponent(comp.id, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronUp size={12} /></button><button onClick={() => moveRunComponent(comp.id, 'down')} disabled={idx === (editedSession.workoutStructure?.length || 0) - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronDown size={12} /></button></div>
                                                    <Icons.Repeat size={14} className="text-purple-500" /><span className="text-xs font-bold text-purple-700">Repeat</span><select value={comp.repeats} onChange={(e) => updateRunComponent(comp.id, 'repeats', parseInt(e.target.value))} className="bg-purple-50 text-xs font-bold rounded px-1 py-0.5 border-none outline-none">{[...Array(20)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}</select><div className="flex-1"></div><button onClick={() => addStepToBlock(comp.id)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><Icons.Plus size={10} /> Sub-step</button><button onClick={() => removeRunComponent(comp.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={14} /></button>
                                                </div>
                                                <div className="pl-4 border-l-2 border-purple-100 space-y-2">{comp.steps.map((step, sIdx) => (
                                                    <div key={step.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                                                        <div className="col-span-1 flex flex-col items-center justify-center gap-0.5"><button onClick={() => moveRunComponent(step.id, 'up', comp.id)} disabled={sIdx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronUp size={10} /></button><button onClick={() => moveRunComponent(step.id, 'down', comp.id)} disabled={sIdx === comp.steps.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronDown size={10} /></button></div>
                                                        <div className="col-span-2"><select value={step.type} onChange={(e) => updateRunComponent(step.id, 'type', e.target.value, comp.id)} className="w-full bg-gray-50 rounded px-1 py-1 border border-gray-200 outline-none">{RUNNING_STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                                        <div className="col-span-3 flex gap-1"><select value={step.durationType} onChange={(e) => updateRunComponent(step.id, 'durationType', e.target.value, comp.id)} className="w-1/2 bg-gray-50 rounded px-1 border border-gray-200 outline-none"><option value="Distance">Dist</option><option value="Time">Time</option></select>
                                                            {step.durationType === 'Distance' ? (
                                                                <DistanceSelector value={step.durationValue} onChange={(v) => updateRunComponent(step.id, 'durationValue', v, comp.id)} className="w-1/2 border-b border-gray-300" />
                                                            ) : (
                                                                <TimeSelector value={step.durationValue} onChange={(v) => updateRunComponent(step.id, 'durationValue', v, comp.id)} className="w-1/2 border-b border-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="col-span-5 flex gap-1 items-center"><select value={step.intensityType} onChange={(e) => updateRunComponent(step.id, 'intensityType', e.target.value, comp.id)} className="w-1/2 bg-gray-50 rounded px-1 border border-gray-200 outline-none"><option value="Pace">Pace</option><option value="Heart Rate">HR</option><option value="None">-</option></select>{step.intensityType === 'Pace' ? (
                                                            <div className="w-1/2">
                                                                <input list="pace-presets" type="text" value={step.intensityValue} onChange={(e) => updateRunComponent(step.id, 'intensityValue', e.target.value, comp.id)} placeholder="5:00" className="w-full border-b border-gray-300 outline-none text-center" />
                                                            </div>
                                                        ) : (<input list="hr-presets" type="text" value={step.intensityValue} onChange={(e) => updateRunComponent(step.id, 'intensityValue', e.target.value, comp.id)} placeholder="bpm" className="w-1/2 border-b border-gray-300 outline-none text-center" />)}</div>
                                                        <div className="col-span-1 text-right"><button onClick={() => removeRunComponent(step.id, comp.id)} className="text-gray-300 hover:text-red-500"><Icons.Minus size={12} /></button></div>
                                                    </div>
                                                ))}</div>
                                            </div>
                                        ) : (
                                            <div key={comp.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200 text-xs">
                                                <div className="col-span-1 flex flex-col items-center justify-center gap-0.5"><button onClick={() => moveRunComponent(comp.id, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronUp size={12} /></button><button onClick={() => moveRunComponent(comp.id, 'down')} disabled={idx === (editedSession.workoutStructure?.length || 0) - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icons.ChevronDown size={12} /></button></div>
                                                <div className="col-span-2"><select value={comp.type} onChange={(e) => updateRunComponent(comp.id, 'type', e.target.value)} className="w-full bg-gray-50 rounded px-1 py-1 border border-gray-200 outline-none font-medium">{RUNNING_STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                                <div className="col-span-3 flex gap-1"><select value={comp.durationType} onChange={(e) => updateRunComponent(comp.id, 'durationType', e.target.value)} className="w-1/2 bg-gray-50 rounded px-1 border border-gray-200 outline-none"><option value="Distance">Dist</option><option value="Time">Time</option></select>
                                                    {comp.durationType === 'Distance' ? (
                                                        <DistanceSelector value={comp.durationValue} onChange={(v) => updateRunComponent(comp.id, 'durationValue', v)} className="w-1/2 border-b border-gray-300" />
                                                    ) : (
                                                        <TimeSelector value={comp.durationValue} onChange={(v) => updateRunComponent(comp.id, 'durationValue', v)} className="w-1/2 border-b border-gray-300" />
                                                    )}
                                                </div>
                                                <div className="col-span-5 flex gap-1 items-center"><select value={comp.intensityType} onChange={(e) => updateRunComponent(comp.id, 'intensityType', e.target.value)} className="w-1/2 bg-gray-50 rounded px-1 border border-gray-200 outline-none"><option value="Pace">Pace</option><option value="Heart Rate">HR</option><option value="None">-</option></select>{comp.intensityType === 'Pace' ? (
                                                    <div className="w-1/2">
                                                        <input list="pace-presets" type="text" value={comp.intensityValue} onChange={(e) => updateRunComponent(comp.id, 'intensityValue', e.target.value)} placeholder="5:00" className="w-full border-b border-gray-300 outline-none text-center" />
                                                    </div>
                                                ) : (<input list="hr-presets" type="text" value={comp.intensityValue} onChange={(e) => updateRunComponent(comp.id, 'intensityValue', e.target.value)} placeholder="bpm" className="w-1/2 border-b border-gray-300 outline-none text-center font-mono" />)}</div>
                                                <div className="col-span-1 text-right"><button onClick={() => removeRunComponent(comp.id)} className="text-gray-300 hover:text-red-500"><Icons.Trash2 size={14} /></button></div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea rows={isGym ? 2 : 4} value={editedSession.notes} onChange={(e) => setEditedSession({ ...editedSession, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none resize-none" placeholder="Comments..." /></div>
                    {!isGym && (<div><label className="block text-sm font-medium text-gray-700 mb-1">RPE (1-10)</label><div className="flex gap-2 items-center"><input type="range" min="0" max="10" step="1" value={editedSession.rpe || 0} onChange={(e) => setEditedSession({ ...editedSession, rpe: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><span className={`font-bold w-8 text-center ${(editedSession.rpe || 0) > 8 ? 'text-red-600' : (editedSession.rpe || 0) > 5 ? 'text-orange-500' : 'text-green-600'}`}>{editedSession.rpe || '-'}</span></div></div>)}
                </div>
                <div className="bg-gray-50 p-4 flex justify-between shrink-0"><button onClick={handleClear} className="flex items-center text-red-500 hover:text-red-700 font-medium px-4 py-2"><Icons.Trash2 size={18} className="mr-2" /> Clear</button><div className="flex gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button><button onClick={() => onSave(editedSession)} className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md"><Icons.Save size={18} className="mr-2" /> Save</button></div></div>
            </div>
        </div>
    );
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.Modals = {
    PeriodizationModal,
    TrainingModal
};
