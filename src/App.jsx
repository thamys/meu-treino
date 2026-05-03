import React, { useState, useEffect } from 'react';
import {
  Timer, CheckCircle2, Circle, Scale, Zap,
  Battery, BatteryMedium, BatteryFull,
  Flame, RefreshCw, Award, CalendarDays,
  PlaySquare, Target, ChevronDown, ChevronUp,
  History, Dumbbell, Trash2
} from 'lucide-react';
import workoutsData from './data/workouts.json';

// Cores hardcoded no componente → Tailwind inclui no bundle (não purga)
const WORKOUT_COLORS = {
  low:  { bg: 'bg-indigo-500',  text: 'text-indigo-500'  },
  med:  { bg: 'bg-emerald-600', text: 'text-emerald-600' },
  high: { bg: 'bg-orange-600',  text: 'text-orange-600'  },
};

const TRACKER_COLORS = {
  peito:       'bg-purple-400',
  costas:      'bg-emerald-400',
  ombros_trap: 'bg-indigo-400',
  bracos:      'bg-cyan-400',
  pernas:      'bg-blue-400',
  gluteos:     'bg-pink-400',
  panturrilha: 'bg-orange-400',
  core:        'bg-amber-400',
};

const ICON_MAP = {
  'battery':        Battery,
  'battery-medium': BatteryMedium,
  'battery-full':   BatteryFull,
};

const STORAGE = {
  weights:    'gym_weights_v11',
  variations: 'gym_variations_v11',
  weekly:     'gym_weekly_v11',
  weekKey:    'gym_week_key_v1',
  history:    'gym_history_v1',
};

function getWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(new Date(d).setDate(diff));
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

const { trackerInfo, workouts } = workoutsData;
const initialStats = Object.fromEntries(Object.keys(trackerInfo).map(k => [k, 0]));

export default function App() {
  const [view, setView]                             = useState('workout');
  const [activeTab, setActiveTab]                   = useState(1);
  const [completedSlots, setCompletedSlots]         = useState({});
  const [weights, setWeights]                       = useState({});
  const [selectedVariations, setSelectedVariations] = useState({});
  const [collapsed, setCollapsed]                   = useState({ Superiores: false, Inferiores: false, Core: false });
  const [weeklyStats, setWeeklyStats]               = useState(initialStats);
  const [history, setHistory]                       = useState([]);

  useEffect(() => {
    try {
      const savedWeekKey = localStorage.getItem(STORAGE.weekKey);
      const currentWeekKey = getWeekKey();

      if (savedWeekKey !== currentWeekKey) {
        // Nova semana → zera tracker automaticamente
        localStorage.setItem(STORAGE.weekKey, currentWeekKey);
        localStorage.setItem(STORAGE.weekly, JSON.stringify(initialStats));
      } else {
        const st = localStorage.getItem(STORAGE.weekly);
        if (st) setWeeklyStats(JSON.parse(st));
      }

      const w = localStorage.getItem(STORAGE.weights);
      const v = localStorage.getItem(STORAGE.variations);
      const h = localStorage.getItem(STORAGE.history);
      if (w) setWeights(JSON.parse(w));
      if (v) setSelectedVariations(JSON.parse(v));
      if (h) setHistory(JSON.parse(h));
    } catch {
      console.error('Erro ao carregar localStorage');
    }
  }, []);

  const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  const toggleSlot = (id) => setCompletedSlots(p => ({ ...p, [id]: !p[id] }));

  const changeVariation = (slotId, total) => {
    const next = ((selectedVariations[slotId] || 0) + 1) % total;
    const u = { ...selectedVariations, [slotId]: next };
    setSelectedVariations(u);
    save(STORAGE.variations, u);
  };

  const changeWeight = (exerciseId, val) => {
    const u = { ...weights, [exerciseId]: val };
    setWeights(u);
    save(STORAGE.weights, u);
  };

  const toggleCollapse = (name) => setCollapsed(p => ({ ...p, [name]: !p[name] }));

  const resetWeek = () => {
    if (!window.confirm('Zerar a contagem da semana?')) return;
    setWeeklyStats(initialStats);
    save(STORAGE.weekly, initialStats);
    localStorage.setItem(STORAGE.weekKey, getWeekKey());
  };

  const clearHistory = () => {
    if (!window.confirm('Apagar todo o histórico?')) return;
    setHistory([]);
    localStorage.removeItem(STORAGE.history);
  };

  const finishWorkout = () => {
    const workout = workouts[activeTab];
    const newStats = { ...weeklyStats };
    const trackersWorked = new Set();
    let count = 0;

    workout.slots.forEach(slot => {
      if (!completedSlots[slot.id]) return;
      if (slot.tracker && newStats[slot.tracker] !== undefined) {
        newStats[slot.tracker] += 1;
        trackersWorked.add(slot.tracker);
      }
      count++;
    });

    if (count === 0) return;

    setWeeklyStats(newStats);
    save(STORAGE.weekly, newStats);

    const entry = {
      id: Date.now().toString(),
      isoDate: new Date().toISOString(),
      workoutId: workout.id,
      workoutName: workout.name,
      count,
      trackers: [...trackersWorked],
    };
    const updated = [entry, ...history];
    setHistory(updated);
    save(STORAGE.history, updated);

    setCompletedSlots({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`Show! Você concluiu ${count} exercícios. 🏆`);
  };

  const workout   = workouts[activeTab];
  const colors    = WORKOUT_COLORS[workout.id];
  const doneCount = workout.slots.filter(s => completedSlots[s.id]).length;
  const progress  = Math.min((doneCount / 6) * 100, 100);

  const grouped = {
    Superiores: workout.slots.filter(s => s.section === 'Superiores'),
    Inferiores: workout.slots.filter(s => s.section === 'Inferiores'),
    Core:       workout.slots.filter(s => s.section === 'Core'),
  };

  return (
    <div className="min-h-screen bg-slate-400 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-xl shadow-sm">
                  <Flame className="text-white w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight leading-none text-slate-800">MEU TREINO</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Body Master</p>
                </div>
              </div>
              <button
                onClick={resetWeek}
                className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full active:bg-slate-200 uppercase tracking-wide"
              >
                <CalendarDays size={12} /> ZERAR
              </button>
            </div>

            {/* Tracker semanal */}
            <div className="bg-slate-800 rounded-2xl p-4 shadow-lg">
              <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Award size={12} className="text-yellow-500" /> Frequência Semanal (Por Grupo)
              </h2>
              <div className="grid grid-cols-4 gap-y-3 gap-x-1">
                {Object.entries(trackerInfo).map(([key, info]) => {
                  const count    = weeklyStats[key] || 0;
                  const dotColor = TRACKER_COLORS[key] || 'bg-slate-400';
                  return (
                    <div key={key} className="flex flex-col gap-1 items-center bg-slate-700/50 p-1.5 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-300 text-center leading-tight h-6 flex items-center justify-center">
                        {info.emoji} {info.label}
                      </span>
                      <div className="flex gap-0.5 w-full">
                        {[1, 2].map(dot => (
                          <div
                            key={dot}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              count >= dot ? `${dotColor} shadow-[0_0_5px_rgba(255,255,255,0.25)]` : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs de navegação */}
          <div className="flex border-t border-slate-100">
            <button
              onClick={() => setView('workout')}
              className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors ${
                view === 'workout'
                  ? 'text-slate-800 border-b-2 border-slate-800 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Dumbbell size={13} /> Treino
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors ${
                view === 'history'
                  ? 'text-slate-800 border-b-2 border-slate-800 bg-slate-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <History size={13} /> Histórico {history.length > 0 && <span className="bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-[9px]">{history.length}</span>}
            </button>
          </div>
        </header>

        {/* ── TREINO ── */}
        {view === 'workout' && (
          <div className="px-4 mt-5 pb-32">

            {/* Seletor de energia */}
            <p className="text-[11px] font-bold text-slate-500 mb-2 px-1 uppercase tracking-wider">Como você está hoje?</p>
            <nav className="flex p-1.5 bg-slate-200 rounded-2xl mb-4 gap-1.5">
              {workouts.map((w, idx) => {
                const wColors = WORKOUT_COLORS[w.id];
                const Icon    = ICON_MAP[w.iconId];
                const isActive = activeTab === idx;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveTab(idx);
                      setCollapsed({ Superiores: false, Inferiores: false, Core: false });
                    }}
                    className={`flex-1 flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all duration-200 ${
                      isActive
                        ? `${wColors.bg} text-white shadow-lg scale-[1.03]`
                        : 'text-slate-500 bg-white/60 hover:bg-white/90'
                    }`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-wider leading-tight text-center">
                      {w.name.replace(' ENERGIA', '')}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mb-5 px-1">
              <p className="text-sm text-slate-600 italic border-l-4 border-slate-300 pl-3">
                {workout.description}
                <br />
                <strong className="text-indigo-500 not-italic text-xs mt-1 block">Meta sugerida: Escolha de 5 a 8 exercícios.</strong>
              </p>
            </div>

            {/* Seções de exercícios */}
            <main className="space-y-5">
              {Object.entries(grouped).map(([sectionName, slots]) => {
                const isCollapsed = collapsed[sectionName];
                const sectionDone = slots.filter(s => completedSlots[s.id]).length;

                return (
                  <div key={sectionName} className="bg-slate-100/60 rounded-[2rem] p-2 border border-slate-200">
                    <button
                      onClick={() => toggleCollapse(sectionName)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-3xl bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">{sectionName}</h2>
                        {sectionDone > 0 && (
                          <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {sectionDone} feitos
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 bg-slate-50 p-1 rounded-full">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-3 mt-3 px-1 pb-2">
                        {slots.map((slot) => {
                          const isDone     = completedSlots[slot.id];
                          const varIndex   = selectedVariations[slot.id] || 0;
                          const exercise   = slot.options[varIndex];
                          const anatomyUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent('anatomia musculo ' + exercise.target)}`;
                          const videoUrl   = `https://www.youtube.com/results?search_query=${encodeURIComponent('como fazer ' + exercise.name + ' academia')}`;

                          return (
                            <div
                              key={slot.id}
                              className={`bg-white rounded-[1.75rem] p-4 border-2 transition-all duration-300 relative overflow-hidden ${
                                isDone ? 'border-transparent bg-slate-100/80 opacity-70' : 'border-white shadow-md shadow-slate-200/60'
                              }`}
                            >
                              <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-full ${isDone ? 'bg-slate-300' : colors.bg}`} />

                              <div className="flex justify-between items-center mb-2.5 pl-2">
                                <div className="text-[10px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                                  {slot.muscle}
                                </div>
                                <button
                                  onClick={() => changeVariation(slot.id, slot.options.length)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full active:bg-slate-200 transition-colors uppercase"
                                >
                                  <RefreshCw size={9} /> Trocar ({varIndex + 1}/{slot.options.length})
                                </button>
                              </div>

                              <div className="flex justify-between items-start mb-3 pl-2">
                                <div className="flex-1 pr-2" onClick={() => toggleSlot(slot.id)}>
                                  <h3 className={`text-base font-black leading-tight mb-1 ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                    {exercise.name}
                                  </h3>
                                  <p className={`text-[11px] font-bold mb-2.5 ${isDone ? 'text-slate-400' : 'text-indigo-500'}`}>
                                    🎯 Foco: {exercise.target}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="bg-slate-100 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                                      <Zap size={11} className={colors.text} /> {exercise.reps}
                                    </span>
                                    <span className="bg-slate-100 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                                      <Timer size={11} className="text-slate-400" /> {exercise.rest}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 items-center">
                                  <button onClick={() => toggleSlot(slot.id)} className="active:scale-90 transition-transform">
                                    {isDone
                                      ? <CheckCircle2 size={38} className={colors.text} strokeWidth={2.5} />
                                      : <Circle size={38} className="text-slate-200" strokeWidth={2.5} />
                                    }
                                  </button>
                                  <div className="flex gap-1">
                                    <a href={anatomyUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg active:bg-indigo-100"
                                      title="Anatomia">
                                      <Target size={14} />
                                    </a>
                                    <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 bg-red-50 text-red-500 rounded-lg active:bg-red-100"
                                      title="Vídeo">
                                      <PlaySquare size={14} />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {activeTab !== 0 && (
                                <div className={`flex items-center gap-2 ml-2 px-3 py-2.5 rounded-xl border transition-all ${
                                  isDone
                                    ? 'bg-slate-200/50 border-transparent'
                                    : 'bg-slate-50 border-slate-200 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm'
                                }`}>
                                  <Scale size={14} className="text-slate-400 shrink-0" />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="CARGA (KG)"
                                    value={weights[exercise.id] || ''}
                                    onChange={(e) => changeWeight(exercise.id, e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400 uppercase tracking-wide"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </main>
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {view === 'history' && (
          <div className="px-4 py-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Histórico de Treinos</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-bold text-red-400 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full active:bg-red-100"
                >
                  <Trash2 size={10} /> LIMPAR
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-slate-600 font-bold">Nenhum treino salvo ainda.</p>
                <p className="text-slate-400 text-sm mt-1 max-w-[220px]">
                  Complete exercícios e clique em "Salvar Treino"!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(entry => {
                  const ec = WORKOUT_COLORS[entry.workoutId] || { bg: 'bg-slate-500' };
                  return (
                    <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full text-white ${ec.bg}`}>
                          {entry.workoutName.replace(' ENERGIA', '')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold">
                          {formatDateTime(entry.isoDate)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2.5">
                        <span className="text-2xl font-black text-slate-800">{entry.count}</span>
                        <span className="text-xs text-slate-500 font-bold">exercícios</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.trackers.map(t => {
                          const info     = trackerInfo[t];
                          const dotColor = TRACKER_COLORS[t] || 'bg-slate-400';
                          if (!info) return null;
                          return (
                            <span key={t} className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${dotColor}`}>
                              {info.emoji} {info.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOTÃO SALVAR (fixo, só no treino) ── */}
        {view === 'workout' && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 pt-6 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-40">
            <button
              onClick={finishWorkout}
              disabled={doneCount === 0}
              className={`w-full rounded-[2rem] p-4 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                doneCount > 0
                  ? `${colors.bg} active:scale-[0.98] cursor-pointer border-4 border-white`
                  : 'bg-slate-200 cursor-not-allowed border-4 border-white/50'
              }`}
            >
              <div className="flex flex-col items-center">
                <h4 className={`font-black text-lg tracking-tight uppercase ${doneCount > 0 ? 'text-white' : 'text-slate-400'}`}>
                  SALVAR TREINO ({doneCount})
                </h4>
                <div className="w-44 h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${doneCount >= 6 ? 'text-yellow-300' : 'text-white/60'}`}>
                  {doneCount >= 6 ? '🔥 Meta Diária Atingida!' : 'Meta sugerida: 6 exercícios'}
                </p>
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
