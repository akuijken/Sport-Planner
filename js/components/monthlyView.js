// --- MONTHLY VIEW COMPONENT ---

const MonthlyDayCard = ({ dateKey, data, isInMonth, onEditMorning, onEditEvening }) => {
    const { toISODate, getTypeBadge, formatMonthlyLabel } = window.SportPlanner.Utils;

    const d = new Date(dateKey);
    const isToday = dateKey === toISODate(new Date());
    const status = data.status || 'neutral';
    const statusStripe = isInMonth ? (status === 'completed' ? 'bg-green-500' : status === 'missed' ? 'bg-red-500' : (isToday ? 'bg-blue-500' : 'bg-transparent')) : 'bg-transparent';
    const cardBase = isInMonth ? 'bg-white border border-gray-200' : 'bg-gray-800';

    return (
        <div className={`rounded-md overflow-hidden transition ${cardBase} h-36 flex flex-col`}>
            <div className={`${statusStripe} h-1 w-full`} />
            <div className="p-2 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1"><div className="text-xs font-bold">{d.getDate()}</div><div className="text-[10px] text-gray-400">{d.toLocaleDateString('en-GB', { weekday: 'short' }).substring(0, 3)}</div></div>
                <div className="flex-1 flex flex-col justify-between text-sm leading-5">
                    <div className="flex items-start gap-2">
                        {data.training1?.type ? (
                            <button onClick={onEditMorning} title={formatMonthlyLabel(data.training1)} className={`flex-1 text-left font-bold text-xs line-clamp-2 whitespace-normal overflow-hidden px-1 py-1 rounded ${isInMonth ? getTypeBadge(data.training1.type) : 'bg-white/5 text-white'}`}>{formatMonthlyLabel(data.training1)}</button>
                        ) : (
                            <button onClick={onEditMorning} className={`flex-1 text-left font-bold text-sm text-gray-300`}>+</button>
                        )}
                    </div>
                    <div className="h-px bg-gray-100 my-1" />
                    <div className="flex items-start gap-2">
                        {data.training2?.type ? (
                            <button onClick={onEditEvening} title={formatMonthlyLabel(data.training2)} className={`flex-1 text-left font-bold text-xs line-clamp-2 whitespace-normal overflow-hidden px-1 py-1 rounded ${isInMonth ? getTypeBadge(data.training2.type) : 'bg-white/5 text-white'}`}>{formatMonthlyLabel(data.training2)}</button>
                        ) : (
                            <button onClick={onEditEvening} className={`flex-1 text-left font-bold text-sm text-gray-300`}>+</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MonthlyView = ({ selectedMonth, workoutDB, onEditTraining, onChangeMonth }) => {
    const { toISODate, getMondayDate, createEmptyDay, calculateWorkoutStats, getTypeDot } = window.SportPlanner.Utils;

    const firstOfMonth = new Date(selectedMonth + '-01');
    const lastOfMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0);
    const gridStart = getMondayDate(firstOfMonth);
    let weekStart = new Date(gridStart);
    const weeks = [];
    // build weeks that include whole month (start on Monday)
    while (weekStart <= lastOfMonth) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const dateKey = toISODate(d);
            const dayData = workoutDB[dateKey] || createEmptyDay(d);
            days.push({ dateKey, data: dayData, isInMonth: d.getMonth() === firstOfMonth.getMonth() });
        }
        weeks.push(days);
        weekStart.setDate(weekStart.getDate() + 7);
    }

    // Monthly totals (exclude days not in this month)
    const totalsPerSport = {};
    let runningKm = 0, runningTime = 0, cyclingKm = 0, cyclingTime = 0;
    const breakdowns = {}; // per-sport subType counts


    weeks.flat().forEach(({ dateKey, data, isInMonth }) => {
        if (!isInMonth) return;
        if (data.status === 'missed') return;
        ['training1', 'training2'].forEach(k => {
            const s = data[k];
            if (!s || !s.type) return;
            totalsPerSport[s.type] = (totalsPerSport[s.type] || 0) + 1;

            // breakdown per sport by subType
            const subKey = s.subType || 'Other';
            breakdowns[s.type] = breakdowns[s.type] || {};
            breakdowns[s.type][subKey] = (breakdowns[s.type][subKey] || 0) + 1;

            if (s.type === 'Running') {
                const st = calculateWorkoutStats(s);
                runningKm += parseFloat(st.totalDist) || 0;
                runningTime += st.totalTime || 0;
            }
            if (s.type === 'Cycling') {
                const st = calculateWorkoutStats(s);
                cyclingKm += parseFloat(st.totalDist) || 0;
                cyclingTime += st.totalTime || 0;
            }
        });
    });

    return (
        <main className="max-w-[1100px] mx-auto px-4 py-8 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{firstOfMonth.toLocaleString('default', { month: 'long' })} {firstOfMonth.getFullYear()}</h2>
                    <p className="text-sm text-gray-500">Monthly summary</p>
                </div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="mt-1 space-y-1">
                        {Object.keys(totalsPerSport).length === 0 ? (<div className="text-sm text-gray-500">No sessions</div>) : (Object.entries(totalsPerSport).map(([k, v]) => {
                            const breakdown = breakdowns[k] || {};
                            const breakdownStr = Object.entries(breakdown).map(([sub, c]) => `${c}x ${sub}`).join(', ');
                            return (
                                <div key={k} className="text-sm flex items-center gap-2">
                                    <span className={`inline-block w-3 h-3 rounded-full ${getTypeDot(k)}`} />
                                    <span className="font-semibold ml-1">{k}</span>: {v}x
                                    {k === 'Running' && runningKm > 0 && <span className="ml-2 text-xs">• {runningKm.toFixed(1)} km / {Math.round(runningTime)} min</span>}
                                    {k === 'Cycling' && cyclingKm > 0 && <span className="ml-2 text-xs">• {cyclingKm.toFixed(1)} km / {Math.round(cyclingTime)} min</span>}
                                    {breakdownStr && <span className="ml-2 text-xs text-gray-500">({breakdownStr})</span>}
                                </div>
                            )
                        }))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
                {weeks.map((week) => (
                    week.map(day => (
                        <MonthlyDayCard key={day.dateKey} dateKey={day.dateKey} data={day.data} isInMonth={day.isInMonth} onEditMorning={() => onEditTraining && onEditTraining(null, day.dateKey, 'training1')} onEditEvening={() => onEditTraining && onEditTraining(null, day.dateKey, 'training2')} />
                    ))
                ))}
            </div>
        </main>
    );
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.MonthlyView = MonthlyView;
