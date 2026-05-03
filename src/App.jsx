import React, { useState, useEffect } from 'react';
import {
  Timer, CheckCircle2, Circle, Scale, Zap,
  Smartphone, BatteryMedium, BatteryFull,
  Flame, RefreshCw, Award, CalendarDays,
  PlaySquare, Target, ChevronDown, ChevronUp,
  History, Dumbbell, Trash2
} from 'lucide-react';
import workoutsData from './data/workouts.json';

// Cores como constantes → Tailwind não purga strings literais
const WORKOUT_COLORS = {
  low:  { bg: 'bg-sky-500',     text: 'text-sky-400'     },
  med:  { bg: 'bg-orange-500',  text: 'text-orange-400'  },
  high: { bg: 'bg-red-500',     text: 'text-red-400'     },
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
  'smartphone':     Smartphone,
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

  // Cor do ícone Zap alinhada à cor do nível de energia ativo
  const zapColor = activeTab === 0 ? 'text-sky-400' : activeTab === 2 ? 'text-red-400' : 'text-orange-400';

  const grouped = {
    Superiores: workout.slots.filter(s => s.section === 'Superiores'),
    Inferiores: workout.slots.filter(s => s.section === 'Inferiores'),
    Core:       workout.slots.filter(s => s.section === 'Core'),
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center select-none font-sans">
      <div className="w-full max-w-md bg-slate-950 min-h-screen relative">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-30 bg-slate-950/98 backdrop-blur-md border-b border-slate-800 pt-safe">
          <div className="px-5 pt-3 pb-3">

            {/* Título */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl">
                  <Flame className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight leading-none text-white">MEU TREINO</h1>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Full Body Master</p>
                </div>
              </div>
              <button
                onClick={resetWeek}
                className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full hover:border-slate-600 hover:text-slate-400 transition-colors uppercase tracking-wide"
              >
                <CalendarDays size={11} /> ZERAR
              </button>
            </div>

            {/* Tracker semanal */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Award size={11} className="text-orange-500" /> Frequência Semanal
              </h2>
              <div className="grid grid-cols-4 gap-y-2.5 gap-x-1.5">
                {Object.entries(trackerInfo).map(([key, info]) => {
                  const count    = weeklyStats[key] || 0;
                  const dotColor = TRACKER_COLORS[key] || 'bg-slate-600';
                  return (
                    <div key={key} className="flex flex-col gap-1 items-center bg-slate-800/60 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] font-semibold text-slate-400 text-center leading-tight h-6 flex items-center justify-center">
                        {info.emoji} {info.label}
                      </span>
                      <div className="flex gap-0.5 w-full">
                        {[1, 2].map(dot => (
                          <div
                            key={dot}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              count >= dot ? `${dotColor}` : 'bg-slate-700'
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
          <div className="flex border-t border-slate-800">
            <button
              onClick={() => setView('workout')}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                view === 'workout'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Dumbbell size={12} /> Treino
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                view === 'history'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <History size={12} /> Histórico
              {history.length > 0 && (
                <span className="bg-orange-500/15 text-orange-500 border border-orange-500/20 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── TREINO ── */}
        {view === 'workout' && (
          <div className="px-4 pt-5 pb-32">

            {/* Seletor de energia */}
            <p className="text-[10px] font-semibold text-slate-600 mb-2 px-1 uppercase tracking-widest">Como você está hoje?</p>
            <nav className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-5 gap-1">
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
                        ? `${wColors.bg} text-white shadow-lg`
                        : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={15} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wider leading-tight text-center">
                      {w.name.replace(' ENERGIA', '')}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Descrição do nível */}
            <div className="mb-5 px-1">
              <p className="text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
                {workout.description}
                <br />
                <strong className={`not-italic text-xs mt-1 block ${colors.text}`}>
                  Meta sugerida: 5 a 8 exercícios.
                </strong>
              </p>
            </div>

            {/* Seções */}
            <main className="space-y-4">
              {Object.entries(grouped).map(([sectionName, slots]) => {
                const isCollapsed = collapsed[sectionName];
                const sectionDone = slots.filter(s => completedSlots[s.id]).length;

                return (
                  <div key={sectionName} className="rounded-[1.75rem] overflow-hidden border border-slate-800 bg-slate-900/50">
                    <button
                      onClick={() => toggleCollapse(sectionName)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-bold text-white tracking-wider uppercase">{sectionName}</h2>
                        {sectionDone > 0 && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colors.text} bg-orange-500/10 border-orange-500/20`}>
                            {sectionDone} feitos
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-px">
                        {slots.map((slot) => {
                          const isDone     = completedSlots[slot.id];
                          const varIndex   = selectedVariations[slot.id] || 0;
                          const exercise   = slot.options[varIndex];
                          const anatomyUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent('anatomia musculo ' + exercise.target)}`;
                          const videoUrl   = `https://www.youtube.com/results?search_query=${encodeURIComponent('como fazer ' + exercise.name + ' academia')}`;

                          return (
                            <div
                              key={slot.id}
                              className={`relative overflow-hidden transition-all duration-300 px-5 py-4 ${
                                isDone
                                  ? 'bg-slate-900/30 opacity-50'
                                  : 'bg-slate-900 hover:bg-slate-800/40'
                              }`}
                            >
                              {/* Barra lateral colorida */}
                              <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${isDone ? 'bg-slate-700' : colors.bg}`} />

                              {/* Cabeçalho do exercício */}
                              <div className="flex justify-between items-center mb-2.5 pl-2">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                  {slot.muscle}
                                </span>
                                <button
                                  onClick={() => changeVariation(slot.id, slot.options.length)}
                                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full transition-colors uppercase"
                                >
                                  <RefreshCw size={9} /> {varIndex + 1}/{slot.options.length}
                                </button>
                              </div>

                              {/* Conteúdo principal */}
                              <div className="flex justify-between items-start pl-2">
                                <div className="flex-1 pr-3" onClick={() => toggleSlot(slot.id)}>
                                  <h3 className={`text-base font-bold leading-tight mb-1 ${isDone ? 'text-slate-600 line-through' : 'text-white'}`}>
                                    {exercise.name}
                                  </h3>
                                  <p className={`text-[11px] font-semibold mb-3 ${isDone ? 'text-slate-700' : colors.text}`}>
                                    🎯 {exercise.target}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                                      <Zap size={10} className={zapColor} /> {exercise.reps}
                                    </span>
                                    <span className="bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                                      <Timer size={10} className="text-slate-600" /> {exercise.rest}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 items-center shrink-0">
                                  <button onClick={() => toggleSlot(slot.id)} className="active:scale-90 transition-transform">
                                    {isDone
                                      ? <CheckCircle2 size={36} className={colors.text} strokeWidth={2} />
                                      : <Circle size={36} className="text-slate-700" strokeWidth={1.5} />
                                    }
                                  </button>
                                  <div className="flex gap-1">
                                    <a href={anatomyUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors"
                                      title="Anatomia">
                                      <Target size={13} />
                                    </a>
                                    <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 bg-red-950/30 text-red-400 border border-red-900/30 rounded-lg hover:bg-red-950/50 transition-colors"
                                      title="Vídeo">
                                      <PlaySquare size={13} />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Campo de carga */}
                              {activeTab !== 0 && (
                                <div className={`flex items-center gap-2 mt-3 ml-2 px-3 py-2.5 rounded-xl border transition-all ${
                                  isDone
                                    ? 'bg-transparent border-transparent'
                                    : 'bg-slate-800/50 border-slate-700 focus-within:border-orange-500/40 focus-within:bg-slate-800'
                                }`}>
                                  <Scale size={13} className="text-slate-600 shrink-0" />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="CARGA (KG)"
                                    value={weights[exercise.id] || ''}
                                    onChange={(e) => changeWeight(exercise.id, e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-300 placeholder:text-slate-700 uppercase tracking-wide"
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Treinos</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-semibold text-red-500/70 flex items-center gap-1 bg-red-950/20 border border-red-900/20 px-3 py-1.5 rounded-full hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 size={10} /> LIMPAR
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4 opacity-30">📋</div>
                <p className="text-slate-500 font-semibold">Nenhum treino salvo ainda.</p>
                <p className="text-slate-700 text-sm mt-1 max-w-[220px]">Complete exercícios e clique em "Salvar Treino"!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map(entry => {
                  const ec = WORKOUT_COLORS[entry.workoutId] || { bg: 'bg-slate-700' };
                  return (
                    <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${ec.bg}`}>
                          {entry.workoutName.replace(' ENERGIA', '')}
                        </span>
                        <span className="text-[10px] text-slate-600 font-semibold">
                          {formatDateTime(entry.isoDate)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2.5">
                        <span className="text-2xl font-bold text-white">{entry.count}</span>
                        <span className="text-xs text-slate-600 font-semibold">exercícios</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.trackers.map(t => {
                          const info     = trackerInfo[t];
                          const dotColor = TRACKER_COLORS[t] || 'bg-slate-600';
                          if (!info) return null;
                          return (
                            <span key={t} className={`text-[9px] font-bold text-slate-900 px-2 py-0.5 rounded-full ${dotColor}`}>
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

        {/* ── BOTÃO SALVAR ── */}
        {view === 'workout' && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-5 pt-8 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-40">
            <button
              onClick={finishWorkout}
              disabled={doneCount === 0}
              className={`w-full rounded-2xl p-4 transition-all duration-300 ${
                doneCount > 0
                  ? `${colors.bg} active:scale-[0.98] cursor-pointer shadow-lg`
                  : 'bg-slate-900 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-center">
                <h4 className={`font-bold text-base tracking-wider uppercase ${doneCount > 0 ? 'text-white' : 'text-slate-700'}`}>
                  SALVAR TREINO ({doneCount})
                </h4>
                <div className="w-40 h-1 bg-black/30 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={`text-[9px] font-semibold uppercase tracking-widest mt-1.5 ${doneCount >= 6 ? 'text-yellow-300' : 'text-white/40'}`}>
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
