// --- INPUT SCREENS AND COMPONENTS ---
const { useState } = React;

const CardioInputTable = ({ type, data, onChange }) => {
    const { TimeSelector } = window.SportPlanner.Selectors;

    const metricLabel = type === 'running' ? 'Pace (min:sec)' : 'Wattage (W)';
    const update = (zone, field, val) => { onChange({ ...data, [zone]: { ...data[zone], [field]: val } }); };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-700"><div className="p-4">Zone</div><div className="p-4">{metricLabel}</div><div className="p-4">Heart Rate (bpm)</div></div>{['lt1', 'lt2', 'vo2'].map((z) => (<div key={z} className="grid grid-cols-3 border-b border-gray-100 last:border-0 items-center"><div className="p-4 font-medium text-gray-800 text-sm uppercase">{z}</div><div className="p-2">{type === 'running' ? (<TimeSelector value={data[z].paceOrPower} onChange={(v) => update(z, 'paceOrPower', v)} />) : (<input type="text" value={data[z].paceOrPower} onChange={(e) => update(z, 'paceOrPower', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none" placeholder="200" />)}</div><div className="p-2"><input type="text" value={data[z].hr} onChange={(e) => update(z, 'hr', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none" placeholder="145" /></div></div>))}</div>
    );
};

const GymInputList = ({ prs, onChange }) => {
    const Icons = window.SportPlanner.Icons;

    const addRow = () => onChange([...prs, { id: Date.now().toString(), name: '', weight: '' }]);
    const updateRow = (id, field, val) => onChange(prs.map(p => p.id === id ? { ...p, [field]: val } : p));
    const deleteRow = (id) => onChange(prs.filter(p => p.id !== id));
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-700 p-4"><div className="col-span-7">Exercise</div><div className="col-span-4">1RM (kg)</div><div className="col-span-1"></div></div>{prs.map(pr => (<div key={pr.id} className="grid grid-cols-12 border-b border-gray-100 last:border-0 p-2 items-center"><div className="col-span-7 pr-2"><input type="text" value={pr.name} onChange={(e) => updateRow(pr.id, 'name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none font-medium" placeholder="Name..." /></div><div className="col-span-4 pr-2"><input type="text" value={pr.weight} onChange={(e) => updateRow(pr.id, 'weight', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm outline-none" placeholder="kg" /></div><div className="col-span-1 flex justify-center"><button onClick={() => deleteRow(pr.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={16} /></button></div></div>))}<div className="p-3 bg-gray-50 border-t border-gray-200"><button onClick={addRow} className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-800"><Icons.Plus size={16} /> Add</button></div></div>
    );
};

const ExerciseDbManager = ({ list, onChange }) => {
    const Icons = window.SportPlanner.Icons;

    const [newEx, setNewEx] = useState('');
    const [filter, setFilter] = useState('');
    const safeList = Array.isArray(list) ? list : [];
    const add = () => { if (newEx && !safeList.includes(newEx)) { onChange([...safeList, newEx].sort()); setNewEx(''); } };
    const remove = (name) => onChange(safeList.filter(l => l !== name));
    const filteredList = safeList.filter(l => l.toLowerCase().includes(filter.toLowerCase()));
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]"><div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3"><div className="flex gap-2"><input type="text" value={newEx} onChange={(e) => setNewEx(e.target.value)} placeholder="New Exercise..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && add()} /><button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Add</button></div><div className="relative"><Icons.Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search DB..." className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none bg-white" /></div></div><div className="overflow-y-auto flex-1 p-2">{filteredList.map(item => (<div key={item} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"><span className="text-sm font-medium text-gray-700">{item}</span><button onClick={() => remove(item)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 size={14} /></button></div>))}</div></div>
    );
};

const InputsScreen = ({ setCurrentScreen }) => {
    const Icons = window.SportPlanner.Icons;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setCurrentScreen('planner')} className="p-2 hover:bg-gray-200 rounded-full transition"><Icons.ArrowLeft /></button><h2 className="text-2xl font-bold text-gray-800">Inputs</h2></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"><button onClick={() => setCurrentScreen('inputs-running')} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all flex flex-col items-center gap-4 group"><div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors"><Icons.Activity size={24} className="text-orange-600" /></div><h3 className="text-lg font-bold text-gray-800">Running</h3></button><button onClick={() => setCurrentScreen('inputs-cycling')} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all flex flex-col items-center gap-4 group"><div className="p-4 bg-cyan-100 rounded-full group-hover:bg-cyan-200 transition-colors"><Icons.Bike size={24} className="text-cyan-600" /></div><h3 className="text-lg font-bold text-gray-800">Cycling</h3></button><button onClick={() => setCurrentScreen('inputs-gym')} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all flex flex-col items-center gap-4 group"><div className="p-4 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors"><Icons.Dumbbell size={24} className="text-indigo-600" /></div><h3 className="text-lg font-bold text-gray-800">Gym PRs</h3></button><button onClick={() => setCurrentScreen('inputs-db')} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all flex flex-col items-center gap-4 group"><div className="p-4 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors"><Icons.Database size={24} className="text-emerald-600" /></div><h3 className="text-lg font-bold text-gray-800">Exercise DB</h3></button></div></div>
    );
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.InputScreens = {
    CardioInputTable,
    GymInputList,
    ExerciseDbManager,
    InputsScreen
};
