'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, CheckCircle2, Plus, Save, Dumbbell, Clock, TrendingUp, RefreshCcw, Zap } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { SuggestedWorkout } from '@/lib/types';

export default function SuggestionsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SuggestedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoutine = async () => {
    if (!userData?.profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userData.profile }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const result = await res.json();
      setPlans(result.plan || []);
    } catch (error: any) {
      console.error('AI Suggestion Error:', error);
      setError(error?.message || 'Erro ao gerar sugestões. Tente novamente.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (userData?.profile) { generateRoutine(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const savePlan = async () => {
    if (!userData || plans.length === 0) return;
    setSaving(true);
    try {
      for (const workout of plans) {
        const { data: newW } = await supabase.from('workouts').insert({
          name: workout.name, category: workout.category, days_of_week: workout.daysOfWeek,
          user_id: userData.uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).select('id').single();

        if (newW) {
          const rows = workout.exercises.map((ex, i) => ({
            workout_id: newW.id, name: ex.name, order: i, weight: ex.weight,
            reps: ex.reps, sets: ex.sets, rest_time: ex.restTime
          }));
          await supabase.from('exercises').insert(rows);
        }
      }
      router.push('/dashboard');
    } catch (error) { console.error('Save error:', error); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white uppercase italic">Analisando seu perfil...</h2>
          <p className="text-zinc-500 text-sm max-w-xs">Nossa IA está criando a melhor estratégia de treino para seu objetivo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500 pb-24">
      <header className="px-6 py-8 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10 border-b border-zinc-900">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold uppercase tracking-tight italic">Sugestão Mágica</h1>
        <div className="w-6" />
      </header>

      <main className="px-6 py-8 space-y-8 max-w-lg mx-auto">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase italic tracking-widest"><Sparkles className="w-4 h-4" /> Recomendado para você</div>
           <h2 className="text-3xl font-black uppercase italic leading-none">Seu novo roteiro semanal</h2>
           <p className="text-zinc-500 text-sm">Com base no seu objetivo de <b>{userData?.profile?.objective}</b> e frequência de <b>{userData?.profile?.frequency}x</b> na semana.</p>
        </div>

        <div className="space-y-6">
          {plans.map((workout, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{workout.category}</span><h3 className="text-xl font-bold text-white">{workout.name}</h3></div>
                <div className="p-3 bg-zinc-800 rounded-2xl"><Dumbbell className="w-5 h-5 text-zinc-500" /></div>
              </div>
              <div className="space-y-2">
                 {workout.exercises.map((ex, exIdx) => (
                   <div key={exIdx} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                      <span className="text-sm text-zinc-300 font-medium">{ex.name}</span>
                      <span className="text-xs text-zinc-600 font-bold">{ex.sets}x{ex.reps}</span>
                   </div>
                 ))}
              </div>
              <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase">
                 <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~45 min</div>
                 <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Foco: Progressão</div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent flex gap-3 max-w-lg mx-auto">
        <button onClick={generateRoutine} className="flex-1 py-5 bg-zinc-900 border border-zinc-800 text-white rounded-3xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"><RefreshCcw className="w-4 h-4" />Refazer</button>
        <button onClick={savePlan} disabled={saving} className="flex-[2] py-5 bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white rounded-3xl font-black italic uppercase text-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
          {saving ? (<div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />) : (<>Adotar Rotina<Zap className="w-5 h-5" /></>)}
        </button>
      </footer>
    </div>
  );
}
