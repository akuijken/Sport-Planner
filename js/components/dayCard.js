// --- DAY CARD COMPONENT ---

const DayCard = ({ day, onEditTraining, onUpdateDay, index, onDragStart, onDrop, onDragOver }) => {
    const { toISODate } = window.SportPlanner.Utils;
    const { SessionSlot, CNSControl } = window.SportPlanner.Sessions;
    const Icons = window.SportPlanner.Icons;

    const isPast = new Date(day.dateKey) < new Date(toISODate(new Date()));
    const isToday = day.dateKey === toISODate(new Date());

    // Status colors
    const getStatusColor = (s) => {
        if (s === 'completed') return 'bg-green-50 border-green-200';
        if (s === 'missed') return 'bg-red-50 border-red-200';
        if (isToday) return 'bg-blue-50 border-blue-200';
        return 'bg-slate-50 border-gray-100';
    };

    const toggleStatus = () => {
        const next = day.status === 'neutral' ? 'completed' : day.status === 'completed' ? 'missed' : 'neutral';
        onUpdateDay(index, { ...day, status: next });
    };

    return (
        <div className={`rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-full hover:shadow-md transition-shadow ${isPast && day.status === 'neutral' ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
            <div className={`p-2 border-b flex justify-between items-center cursor-pointer transition-colors ${getStatusColor(day.status || 'neutral')}`} onClick={toggleStatus}>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><span className="capitalize">{day.dayName.substring(0, 3)}</span><span className="text-slate-500 font-normal">{day.date}</span></h3>
                <div className="text-slate-400 hover:text-slate-600">
                    {day.status === 'completed' ? <Icons.CheckCircle className="text-green-600" size={16} /> : day.status === 'missed' ? <Icons.XCircle className="text-red-500" size={16} /> : <Icons.Circle size={16} />}
                </div>
            </div>
            <div className="p-2 flex flex-col gap-2 flex-1">
                <div className="flex-1"><SessionSlot session={day.training1} label="Morning" onClick={() => onEditTraining(index, 'training1')} icon={<Icons.Sun className="w-4 h-4" />} onDragStart={(e) => onDragStart(e, index, 'training1')} onDrop={(e) => onDrop(e, index, 'training1')} onDragOver={onDragOver} /></div>
                <div className="flex-1"><SessionSlot session={day.training2} label="Evening" onClick={() => onEditTraining(index, 'training2')} icon={<Icons.Moon className="w-4 h-4" />} onDragStart={(e) => onDragStart(e, index, 'training2')} onDrop={(e) => onDrop(e, index, 'training2')} onDragOver={onDragOver} /></div>
            </div>
            <CNSControl level={day.cnsFatigue} onChange={(l) => onUpdateDay(index, { ...day, cnsFatigue: l })} />
            <div className="px-2 pb-2">
                <textarea placeholder="Daily notes..." value={day.dailyNotes || ''} onChange={(e) => onUpdateDay(index, { ...day, dailyNotes: e.target.value })} className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-1.5 outline-none resize-none h-8 focus:h-16 transition-all" />
            </div>
        </div>
    );
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.DayCard = DayCard;
