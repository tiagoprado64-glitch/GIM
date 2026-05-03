'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Clock, Timer, ChevronLeft, ChevronRight, TrendingUp, History as HistoryIcon, X, Trophy } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Exercise, SetRecord } from '@/lib/types';

export default function WorkoutExecution() {
  const { id: workoutId } = useParams() as { id: string };
  const { userData } = useAuth();
  const router = useRouter();

  const [workout, setWorkout] = useState<{name: string} | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [currentInputs, setCurrentInputs] = useState<Record<number, { reps: number, weight: number }>>({});
  const [progress, setProgress] = useState<Record<string, SetRecord[]>>({});
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (workoutId && userData) {
      const loadData = async () => {
        try {
          const { data: wData } = await supabase.from('workouts').select('name').eq('id', workoutId).single();
          if (wData) setWorkout({ name: wData.name });

          const { data: eData } = await supabase.from('exercises').select('*').eq('workout_id', workoutId).order('order', { ascending: true });
          if (eData) setExercises(eData.map(e => ({ id: e.id, name: e.name, order: e.order, weight: e.weight, reps: e.reps, sets: e.sets, restTime: e.rest_time, videoUrl: e.video_url })));

          const { data: lastData } = await supabase.from('executions').select('*').eq('user_id', userData.uid).eq('workout_id', workoutId).order('date', { ascending: false }).limit(1);
          if (lastData && lastData.length > 0) setLastExecution(lastData[0]);
        } catch (error) { console.error('Load error:', error); }
        finally { setLoading(false); }
      };
      loadData();
    }
  }, [workoutId, userData]);

  useEffect(() => {
    if (exercises[currentIndex]) {
      const ex = exercises[currentIndex];
      const lastExData = lastExecution?.data?.[ex.id] || [];
      const newInputs: Record<number, { reps: number, weight: number }> = {};
      for (let i = 0; i < ex.sets; i++) {
        newInputs[i] = { reps: lastExData[i]?.reps || ex.reps, weight: lastExData[i]?.weight || ex.weight };
      }
      setCurrentInputs(newInputs);
    }
  }, [currentIndex, exercises, lastExecution]);

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(seconds);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) { clearInterval(timerRef.current!); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const completeSet = (index: number) => {
    const currentEx = exercises[currentIndex];
    const input = currentInputs[index];
    const newRecord: SetRecord = { ...input, completedAt: new Date() };
    setProgress(prev => ({ ...prev, [currentEx.id]: [...(prev[currentEx.id] || []), newRecord] }));
    startTimer(currentEx.restTime);
  };

  const updateInput = (index: number, field: 'reps' | 'weight', value: number) => {
    setCurrentInputs(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
  };

  const handleFinish = async () => {
    if (!userData) return;
    setIsFinishing(true);
    try {
      await supabase.from('executions').insert({ user_id: userData.uid, workout_id: workoutId, data: progress, duration: 0 });
      setShowSummary(true);
    } catch (error) { console.error('Save error:', error); }
    finally { setIsFinishing(false); }
  };

  if (loading) return null;
  const currentEx = exercises[currentIndex];
  const completedSets = progress[currentEx?.id] || [];
  const lastSessionExData = lastExecution?.data?.[currentEx?.id] || [];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-xl text-zinc-500"><ArrowLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-white uppercase tracking-widest">{workout?.name}</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">{currentIndex + 1} de {exercises.length}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-2">
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }} />
        </div>
      </div>

      <main className="flex-1 px-6 py-8 flex flex-col justify-between max-w-lg mx-auto w-full overflow-y-auto">
        <div className="space-y-6">
          <motion.div key={currentEx?.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
            <h2 className="text-3xl font-bold text-white leading-tight">{currentEx?.name}</h2>
            <div className="flex gap-4"><span className="text-zinc-500 text-sm font-medium">Meta: {currentEx?.sets} Séries</span></div>
          </motion.div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Controle de Séries</h3>
              <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold"><TrendingUp className="w-3 h-3" /> Progressão</div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: currentEx?.sets }).map((_, i) => {
                const record = completedSets[i];
                const lastSetData = lastSessionExData[i];
                const currentInput = currentInputs[i] || { reps: 0, weight: 0 };
                return (
                  <div key={i} className={`p-5 rounded-3xl flex flex-col gap-4 border transition-all duration-300 ${record ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${record ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                          {lastSetData && (<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Anterior: <span className="text-zinc-400">{lastSetData.weight}kg x {lastSetData.reps}</span></span>)}
                       </div>
                       {record && <Check className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <span className={`text-[8px] font-bold uppercase block ${record ? 'text-white/60' : 'text-zinc-600'}`}>Peso (kg)</span>
                        <input type="number" value={record ? record.weight : currentInput.weight} onChange={(e) => updateInput(i, 'weight', parseFloat(e.target.value))} disabled={!!record} className={`w-full bg-transparent text-xl font-bold outline-none ${record ? 'text-white' : 'text-zinc-100'}`} />
                      </div>
                      <X className={`w-4 h-4 ${record ? 'text-white/30' : 'text-zinc-800'}`} />
                      <div className="flex-1 space-y-1">
                        <span className={`text-[8px] font-bold uppercase block ${record ? 'text-white/60' : 'text-zinc-600'}`}>Reps</span>
                        <input type="number" value={record ? record.reps : currentInput.reps} onChange={(e) => updateInput(i, 'reps', parseInt(e.target.value))} disabled={!!record} className={`w-full bg-transparent text-xl font-bold outline-none ${record ? 'text-white' : 'text-zinc-100'}`} />
                      </div>
                      {!record && (<button onClick={() => completeSet(i)} className="px-6 py-3 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-white rounded-2xl text-xs font-bold transition-all border border-zinc-700 active:scale-95">OK</button>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-6">
          <AnimatePresence>
            {timerSeconds !== null && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full animate-pulse"><Timer className="w-5 h-5" /></div>
                  <div><span className="text-xs font-bold uppercase opacity-80">Descanso</span><p className="text-lg font-black">{timerSeconds}s</p></div>
                </div>
                <button onClick={() => setTimerSeconds(null)} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold">Pular</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-4">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 disabled:opacity-20"><ChevronLeft className="w-6 h-6" /></button>
            {currentIndex === exercises.length - 1 ? (
              <button onClick={handleFinish} disabled={isFinishing} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2">{isFinishing ? 'Salvando...' : 'Finalizar Treino'}<Trophy className="w-5 h-5" /></button>
            ) : (
              <button onClick={() => setCurrentIndex(prev => prev + 1)} className="flex-1 py-4 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">Próximo Exercício<ChevronRight className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="text-center space-y-8">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 relative">
                <Trophy className="w-12 h-12 text-indigo-400" />
                <motion.div className="absolute inset-0 border-2 border-indigo-500 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
              <div className="space-y-2"><h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Parabéns!</h2><p className="text-zinc-500">Mais um treino finalizado com sucesso.</p></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800"><span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Duração</span><span className="text-white font-bold">42 min</span></div>
                 <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800"><span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Volume</span><span className="text-white font-bold">8.420 kg</span></div>
              </div>
              <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">Voltar ao Dashboard</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
