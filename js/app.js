// --- MAIN APP COMPONENT ---
const { useState, useEffect, useMemo, useRef } = React;

function App() {
    // Get dependencies from global namespace
    const { DEFAULT_FITNESS_DATA } = window.SportPlanner.Constants;
    const { getDefaultStartDate, getMondayDate, toISODate, createEmptyDay, getWeekNumber, calculateWorkoutStats, uid } = window.SportPlanner.Utils;
    const Icons = window.SportPlanner.Icons;
    const DayCard = window.SportPlanner.DayCard;
    const { PeriodizationModal, TrainingModal } = window.SportPlanner.Modals;
    const { InputsScreen, CardioInputTable, GymInputList, ExerciseDbManager } = window.SportPlanner.InputScreens;
    const MonthlyView = window.SportPlanner.MonthlyView;

    const [startDate, setStartDate] = useState(getDefaultStartDate());
    const [currentScreen, setCurrentScreen] = useState('planner');
    const [selectedMonth, setSelectedMonth] = useState(() => (new Date()).toISOString().slice(0, 7)); // YYYY-MM
    const fileInputRef = useRef(null);
    const [clipboard, setClipboard] = useState(null);
    const [dragSource, setDragSource] = useState(null);

    const [workoutDB, setWorkoutDB] = useState(() => {
        const saved = localStorage.getItem('workout_db_v1');
        if (saved) { try { return JSON.parse(saved); } catch (e) { } }
        return {};
    });
    const [fitnessData, setFitnessData] = useState(() => {
        const saved = localStorage.getItem('fitness_data_v1');
        let data = DEFAULT_FITNESS_DATA;
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                data = { ...DEFAULT_FITNESS_DATA, ...parsed };
            } catch (e) { }
        }
        return data;
    });

    // Stores week-level metadata, keyed by the start date of the week (Monday)
    const [weekMetadata, setWeekMetadata] = useState(() => {
        const saved = localStorage.getItem('week_metadata_v1');
        if (saved) { try { return JSON.parse(saved); } catch (e) { } }
        return {};
    });

    const [activeModal, setActiveModal] = useState(null);
    const [activePeriodizationModal, setActivePeriodizationModal] = useState(null);

    useEffect(() => { localStorage.setItem('workout_db_v1', JSON.stringify(workoutDB)); }, [workoutDB]);
    useEffect(() => { localStorage.setItem('fitness_data_v1', JSON.stringify(fitnessData)); }, [fitnessData]);
    useEffect(() => { localStorage.setItem('week_metadata_v1', JSON.stringify(weekMetadata)); }, [weekMetadata]);

    const currentView = useMemo(() => {
        const start = new Date(startDate);
        const monday = getMondayDate(start);
        monday.setHours(12, 0, 0, 0);
        const days = [];
        // 8 Weeks = 56 Days
        for (let i = 0; i < 56; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            const dateKey = toISODate(current);

            // Force English formatting to overwrite potential legacy Dutch data in localStorage
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const freshDayName = dayNames[current.getDay()];
            const freshDateStr = current.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            if (workoutDB[dateKey]) {
                days.push({
                    dateKey,
                    data: {
                        ...workoutDB[dateKey],
                        dayName: freshDayName,
                        date: freshDateStr
                    }
                });
            } else {
                days.push({ dateKey, data: createEmptyDay(current) });
            }
        }
        return days;
    }, [startDate, workoutDB]);

    const handleEditTraining = (dayIndex, trainingKey) => { const item = currentView[dayIndex]; if (item) setActiveModal({ dateKey: item.dateKey, trainingKey }); };
    const handleEditTrainingByDate = (_, dateKey, trainingKey) => { if (dateKey) setActiveModal({ dateKey, trainingKey }); };

    // Unified update handler for everything on the day card
    const handleUpdateDay = (dayIndex, updatedDay) => {
        const item = currentView[dayIndex];
        if (!item) return;
        setWorkoutDB(prev => ({ ...prev, [item.dateKey]: updatedDay }));
    };
    const handleUpdateCNS = (dayIndex, level) => {
        const item = currentView[dayIndex];
        if (item) handleUpdateDay(dayIndex, { ...item.data, cnsFatigue: level });
    };

    const handleSaveTraining = (updatedSession) => {
        if (!activeModal) return;

        // If this is a Gym session, add any new exercise names to the exercise database (case-insensitive, no duplicates)
        if (updatedSession.type === 'Gym' && Array.isArray(updatedSession.exercises) && updatedSession.exercises.length > 0) {
            setFitnessData(prev => {
                const current = Array.isArray(prev.exerciseDatabase) ? [...prev.exerciseDatabase] : [];
                let changed = false;
                updatedSession.exercises.forEach(ex => {
                    const name = (ex.name || '').trim();
                    if (!name) return;
                    const exists = current.some(n => n.toLowerCase() === name.toLowerCase());
                    if (!exists) { current.push(name); changed = true; }
                });
                if (!changed) return prev;
                return { ...prev, exerciseDatabase: current.sort((a, b) => a.localeCompare(b)) };
            });
        }

        setWorkoutDB(prev => {
            const existingDay = prev[activeModal.dateKey] || createEmptyDay(new Date(activeModal.dateKey));
            return { ...prev, [activeModal.dateKey]: { ...existingDay, [activeModal.trainingKey]: updatedSession } };
        });
        setActiveModal(null);
    };

    const handleUpdatePeriodization = (weekKey, phase) => {
        setWeekMetadata(prev => ({
            ...prev,
            [weekKey]: { ...prev[weekKey], periodization: phase }
        }));
        setActivePeriodizationModal(null);
    };

    const handleDragStart = (e, dayIndex, sessionKey) => setDragSource({ dayIndex, sessionKey });
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, targetDayIndex, targetSessionKey) => {
        e.preventDefault();
        if (!dragSource) return;
        const sourceDateKey = currentView[dragSource.dayIndex].dateKey;
        const targetDateKey = currentView[targetDayIndex].dateKey;
        if (sourceDateKey === targetDateKey && dragSource.sessionKey === targetSessionKey) return;
        setWorkoutDB(prev => {
            const newDB = { ...prev };
            if (!newDB[sourceDateKey]) newDB[sourceDateKey] = createEmptyDay(new Date(sourceDateKey));
            if (!newDB[targetDateKey]) newDB[targetDateKey] = createEmptyDay(new Date(targetDateKey));
            const sourceSession = newDB[sourceDateKey][dragSource.sessionKey];
            const targetSession = newDB[targetDateKey][targetSessionKey];
            newDB[sourceDateKey] = { ...newDB[sourceDateKey], [dragSource.sessionKey]: targetSession };
            newDB[targetDateKey] = { ...newDB[targetDateKey], [targetSessionKey]: sourceSession };
            return newDB;
        });
        setDragSource(null);
    };

    const handleCopy = (session) => { setClipboard(session); alert('Session copied!'); };
    const handlePaste = () => clipboard;

    const handleBackup = () => {
        const blob = new Blob([JSON.stringify({ version: 3, timestamp: new Date(), workoutDB, fitnessData, weekMetadata })], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleRestore = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result);
                if (data.workoutDB && window.confirm("Overwrite current data?")) {
                    setWorkoutDB(data.workoutDB);
                    if (data.fitnessData) setFitnessData(data.fitnessData);
                    if (data.weekMetadata) setWeekMetadata(data.weekMetadata);
                }
            } catch (err) { alert("Invalid file"); }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const currentSession = activeModal ? (workoutDB[activeModal.dateKey] || createEmptyDay(new Date(activeModal.dateKey)))[activeModal.trainingKey] : { id: '', type: null, subType: '', notes: '' };
    const activeDayForModal = activeModal ? (workoutDB[activeModal.dateKey] || createEmptyDay(new Date(activeModal.dateKey))) : null;

    const renderRow = (rowIndex) => {
        const startIndex = rowIndex * 7;
        const days = currentView.slice(startIndex, startIndex + 7);
        if (days.length === 0) return null;
        const weekNum = getWeekNumber(new Date(days[0].dateKey));
        const weekStartKey = days[0].dateKey;
        const weekPhase = weekMetadata[weekStartKey]?.periodization;

        // Calculate Totals
        let runDist = 0, runTime = 0, runCount = 0, cycleDist = 0, cycleTime = 0, gymCount = 0, footballCount = 0;
        days.forEach(d => {
            if (d.data.status === 'missed') return;
            [d.data.training1, d.data.training2].forEach(s => {
                if (!s.type) return;
                if (s.type === 'Gym') gymCount++;
                if (s.type === 'Football') footballCount++;
                if (s.type === 'Running') {
                    runCount++;
                    const stats = calculateWorkoutStats(s);
                    runDist += parseFloat(stats.totalDist) || 0;
                    runTime += stats.totalTime || 0;
                }
                if (s.type === 'Cycling') {
                    const stats = calculateWorkoutStats(s);
                    cycleDist += parseFloat(stats.totalDist) || 0;
                    cycleTime += stats.totalTime || 0;
                }
            });
        });

        return (
            <div key={rowIndex} className="mb-6 last:mb-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-slate-800 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm">Week {weekNum}</div>
                    <div className="flex gap-4 text-[10px] md:text-xs text-gray-500 font-medium items-center">
                        {runCount > 0 && <span className="flex items-center gap-1"><Icons.Activity size={14} className="text-orange-500" /> {runCount}x | {runDist.toFixed(1)}km</span>}
                        {cycleDist > 0 && <span className="flex items-center gap-1"><Icons.Bike size={12} className="text-cyan-500" /> {cycleDist.toFixed(1)}km / {Math.floor(cycleTime / 60)}h{cycleTime % 60}m</span>}
                        <button
                            onClick={() => setActivePeriodizationModal({ weekKey: weekStartKey })}
                            className="flex items-center gap-1 hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer group"
                        >
                            <Icons.Dumbbell size={12} className="text-indigo-500" />
                            <span className={gymCount > 0 ? "text-gray-700" : "text-gray-400"}>{gymCount}x</span>
                            {weekPhase && <span className="text-indigo-600 font-bold border-l border-gray-300 pl-1 ml-1">{weekPhase}</span>}
                            {!weekPhase && <span className="opacity-0 group-hover:opacity-100 text-[9px] text-gray-400 ml-1">+Phase</span>}
                        </button>
                        {footballCount > 0 && <span className="flex items-center gap-1"><Icons.PlayCircle size={12} className="text-green-500" /> {footballCount}x</span>}
                    </div>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">{days.map((item, idx) => (<DayCard key={item.dateKey} day={item.data} index={startIndex + idx} onEditTraining={handleEditTraining} onUpdateDay={handleUpdateDay} onUpdateCNS={handleUpdateCNS} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} />))}</div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-20 overflow-x-hidden">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1900px] mx-auto px-4 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full xl:w-auto"><div className="bg-blue-600 p-2 rounded-lg text-white shrink-0"><Icons.FileSpreadsheet size={24} /></div><div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full"><div><h1 className="text-xl font-bold text-gray-900 leading-tight">Sport Planner</h1><p className="text-sm text-gray-500">8 Week View</p></div><div className="flex gap-2"><button onClick={() => setCurrentScreen('inputs')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${currentScreen.startsWith('inputs') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Inputs</button><button onClick={() => setCurrentScreen('planner')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${currentScreen === 'planner' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Planner</button><button onClick={() => setCurrentScreen('monthly')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${currentScreen === 'monthly' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Monthly</button></div>{currentScreen === 'planner' && <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200"><Icons.Calendar size={16} className="text-gray-500 ml-2" /><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none text-sm text-gray-800 font-semibold focus:ring-0 cursor-pointer outline-none" /></div>}
                        {currentScreen === 'monthly' && (
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200"><Icons.Calendar size={16} className="text-gray-500 ml-2" /><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-sm text-gray-800 font-semibold focus:ring-0 cursor-pointer outline-none" /></div>
                        )}</div></div>
                    {currentScreen === 'planner' && (<div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 items-center"><input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".json" /><button onClick={handleBackup} className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg font-medium hover:bg-gray-100 transition whitespace-nowrap border border-gray-200 text-sm"><Icons.Save size={16} /><span className="hidden sm:inline">Backup</span></button><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-lg font-medium hover:bg-gray-100 transition whitespace-nowrap border border-gray-200 text-sm"><Icons.Upload size={16} /><span className="hidden sm:inline">Restore</span></button></div>)}
                </div>
            </header>
            {currentScreen === 'planner' && (<main className="max-w-[1900px] mx-auto px-4 py-8">{currentView.every(d => !d.data.training1.type && !d.data.training2.type) && <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3"><Icons.Info className="w-5 h-5 text-blue-600 mt-0.5" /><div><h3 className="font-semibold text-blue-900">Start Planning</h3><p className="text-blue-700 text-sm">Select a date. Drag & Drop workouts to move them.</p></div></div>}<div className="space-y-4">{[...Array(8)].map((_, rowIndex) => renderRow(rowIndex))}</div></main>)}
            {currentScreen === 'monthly' && <MonthlyView selectedMonth={selectedMonth} workoutDB={workoutDB} onEditTraining={handleEditTrainingByDate} onChangeMonth={setSelectedMonth} />}
            {currentScreen === 'inputs' && <InputsScreen setCurrentScreen={setCurrentScreen} />}
            {currentScreen === 'inputs-running' && <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setCurrentScreen('inputs')} className="p-2 hover:bg-gray-200 rounded-full transition"><Icons.ArrowLeft /></button><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-full"><Icons.Activity size={24} className="text-orange-600" /></div><h2 className="text-2xl font-bold text-gray-800">Running</h2></div></div><CardioInputTable type="running" data={fitnessData.running} onChange={(d) => setFitnessData({ ...fitnessData, running: d })} /></div>}
            {currentScreen === 'inputs-cycling' && <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setCurrentScreen('inputs')} className="p-2 hover:bg-gray-200 rounded-full transition"><Icons.ArrowLeft /></button><div className="flex items-center gap-3"><div className="p-2 bg-cyan-100 rounded-full"><Icons.Bike size={24} className="text-cyan-600" /></div><h2 className="text-2xl font-bold text-gray-800">Cycling</h2></div></div><CardioInputTable type="cycling" data={fitnessData.cycling} onChange={(d) => setFitnessData({ ...fitnessData, cycling: d })} /></div>}
            {currentScreen === 'inputs-gym' && <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setCurrentScreen('inputs')} className="p-2 hover:bg-gray-200 rounded-full transition"><Icons.ArrowLeft /></button><div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 rounded-full"><Icons.Dumbbell size={24} className="text-indigo-600" /></div><h2 className="text-2xl font-bold text-gray-800">Gym PRs</h2></div></div><GymInputList prs={fitnessData.gym} onChange={(prs) => setFitnessData({ ...fitnessData, gym: prs })} /></div>}
            {currentScreen === 'inputs-db' && <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setCurrentScreen('inputs')} className="p-2 hover:bg-gray-200 rounded-full transition"><Icons.ArrowLeft /></button><div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-full"><Icons.Database size={24} className="text-emerald-600" /></div><h2 className="text-2xl font-bold text-gray-800">Exercise DB</h2></div></div><ExerciseDbManager list={fitnessData.exerciseDatabase} onChange={(l) => setFitnessData({ ...fitnessData, exerciseDatabase: l })} /></div>}
            <TrainingModal isOpen={!!activeModal} onClose={() => setActiveModal(null)} onSave={handleSaveTraining} session={currentSession} title={activeDayForModal ? `${activeDayForModal.dayName} (${activeDayForModal.date})` : ''} onCopy={handleCopy} onPaste={clipboard ? handlePaste : undefined} canPaste={!!clipboard} fitnessData={fitnessData} />

            <PeriodizationModal
                isOpen={!!activePeriodizationModal}
                onClose={() => setActivePeriodizationModal(null)}
                onSelect={(phase) => activePeriodizationModal && handleUpdatePeriodization(activePeriodizationModal.weekKey, phase)}
                currentPhase={activePeriodizationModal ? weekMetadata[activePeriodizationModal.weekKey]?.periodization : null}
            />
        </div>
    );
}

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.App = App;
