// --- CONSTANTS ---
const TRAINING_TYPES = ['Gym', 'Running', 'Cycling', 'Football', 'Rest', 'Other'];

const SUB_TYPES = {
    Gym: ['Full body strength', 'Lower body strength', 'Upper body strength', 'Lower body strength-speed', 'Full body strength-speed', 'Push', 'Pull', 'Legs', 'Other'],
    Running: ['Recovery run', 'Easy run', 'Chill run', 'Endurance run', 'Tempo run', 'Threshold interval run', 'VO2max interval run', 'Sprint interval run', 'Repeated sprint run', 'Long run', 'Race', 'Challenge', 'Other'],
    Cycling: ['Recovery ride', 'Chill ride', 'Endurance ride', 'Tempo ride', 'Threshold interval ride', 'VO2max interval ride', 'Sprint interval ride', 'Repeated sprint ride', 'Long ride', 'Race', 'Challenge', 'Other'],
    Football: ['Training', 'Match', 'Other'],
    Rest: ['Active Recovery', 'Full Rest', 'Stretching', 'Massage'],
    Other: ['Padel', 'Walking', 'Swimming', 'Yoga', 'Pilates', 'Hiking', 'Tennis']
};

const SUPERSET_COLORS = [
    'bg-green-50 border-green-200',
    'bg-blue-50 border-blue-200',
    'bg-yellow-50 border-yellow-200',
    'bg-pink-50 border-pink-200',
    'bg-orange-50 border-orange-200',
    'bg-purple-50 border-purple-200',
    'bg-red-50 border-red-200',
    'bg-teal-50 border-teal-200'
];

const SUPERSET_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PERIODIZATION_OPTIONS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Deload', 'Peak Week', 'Hypertrophy', 'Strength', 'Power', 'Other'];
const RUNNING_STEP_TYPES = ['W-up', 'Run', 'Recovery', 'Rest', 'C-down', 'Other'];

const DEFAULT_FITNESS_DATA = {
    running: { lt1: { paceOrPower: '', hr: '' }, lt2: { paceOrPower: '', hr: '' }, vo2: { paceOrPower: '', hr: '' } },
    cycling: { lt1: { paceOrPower: '', hr: '' }, lt2: { paceOrPower: '', hr: '' }, vo2: { paceOrPower: '', hr: '' } },
    gym: [
        { id: '1', name: 'Squat', weight: '' },
        { id: '2', name: 'Bench Press', weight: '' },
        { id: '3', name: 'Deadlift', weight: '' },
        { id: '4', name: 'Pull Up', weight: '' },
    ],
    exerciseDatabase: []
};

window.SportPlanner = window.SportPlanner || {};
window.SportPlanner.Constants = {
    TRAINING_TYPES,
    SUB_TYPES,
    SUPERSET_COLORS,
    SUPERSET_LETTERS,
    PERIODIZATION_OPTIONS,
    RUNNING_STEP_TYPES,
    DEFAULT_FITNESS_DATA
};
