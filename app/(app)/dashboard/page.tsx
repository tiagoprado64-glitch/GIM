'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Play, Calendar, TrendingUp, Clock, ChevronRight, Zap, CheckCircle2, BarChart3, Dumbbell, Sparkles } from 'lucide-react';
import { format, isToday, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import type { WorkoutTemplate, ExecutionLog } from '@/lib/types';

const CHART_DATA = [
  { day: 'Seg', volume: 1200 }, { day: 'Ter', volume: 1500 },
  { day: 'Qua', volume: 0 }, { day: 'Qui', volume: 1800 },
  { day: 'Sex', volume: 2200 }, { day: 'Sáb', volume: 1400 },
  { day: 'Dom', volume: 0 },
];

export default function Dashboard() {
  const { userData } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [recentExecution, setRecentExecution] = useState<ExecutionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!userData) return;
    const fetchData = async () => {
      try {
        const { data: wList } = await supabase.from('workouts').select('*').eq('user_id', userData.uid);
        setWorkouts((wList || []).map(w => ({ id: w.id, name: w.name, category: w.category, daysOfWeek: w.days_of_week || [] })));
        const { data: eList } = await supabase.from('executions').select('*').eq('user_id', userData.uid).order('date', { ascending: false }).limit(1);
        if (eList && eList.length > 0) {
          const e = eList[0];
          setRecentExecution({ id: e.id, workoutId: e.workout_id, date: e.date, data: e.data, duration: e.duration });
        }
      } catch (error) { console.error('Dashboard fetch error:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [userData]);

  const todayNum = new Date().getDay();
  const suggestedWorkout = workouts.find(w => w.daysOfWeek.includes(todayNum));
  const recentWorkoutName = workouts.find(w => w.id === recentExecution?.workoutId)?.name || 'Nenhum';

  return (
    <div className="px-6 py-8 space-y-8 max-w-lg mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Olá, {userData?.displayName?.split(' ')[0]} 👋</h1>
          <p className="text-zinc-500 text-sm">Pronto para o treino de hoje?</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
          <Zap className="w-6 h-6 text-indigo-400" />
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Esta Semana</h2>
          <Calendar className="w-4 h-4 text-zinc-600" />
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const isSelected = isToday(day);
            return (
              <div key={i} className="flex flex-col items-center space-y-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase">{format(day, 'EEE', { locale: ptBR }).replace('.', '')}</span>
                <div className={`w-10 h-14 rounded-2xl flex items-center justify-center border transition-all text-sm font-bold ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{format(day, 'dd')}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Sugestão de Hoje</h2>
        {suggestedWorkout ? (
          <Link href={`/workout/${suggestedWorkout.id}`}>
            <motion.div whileTap={{ scale: 0.98 }} className="relative p-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white overflow-hidden shadow-2xl shadow-indigo-600/30 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">{suggestedWorkout.category}</span>
                  <h3 className="text-2xl font-bold">{suggestedWorkout.name}</h3>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-xs opacity-80"><Clock className="w-3.5 h-3.5" />45-60 min</div>
                    <div className="flex items-center gap-1 text-xs opacity-80"><TrendingUp className="w-3.5 h-3.5" />Intermediário</div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white text-white ml-1" />
                </div>
              </div>
            </motion.div>
          </Link>
        ) : (
          <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 border-dashed text-center space-y-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative z-10 space-y-4">
                <div className="p-4 bg-indigo-500/10 rounded-3xl w-fit mx-auto"><Sparkles className="w-8 h-8 text-indigo-400" /></div>
                <div>
                   <h3 className="text-white font-bold">Nenhum treino planejado</h3>
                   <p className="text-zinc-500 text-xs px-4">Use nossa Inteligência Artificial para gerar um roteiro personalizado com base no seu perfil.</p>
                </div>
                <Link href="/suggestions" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-2xl font-black italic uppercase text-xs active:scale-95 transition-all shadow-xl shadow-white/5">Criar Rotina com IA<Zap className="w-4 h-4" /></Link>
             </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400"><CheckCircle2 className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Último Treino</span></div>
          <h4 className="text-white font-bold truncate">{recentWorkoutName}</h4>
          <p className="text-zinc-600 text-xs italic">{recentExecution ? format(new Date(recentExecution.date), "dd 'de' MMM", { locale: ptBR }) : '---'}</p>
        </div>
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400"><TrendingUp className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Volume Total</span></div>
          <h4 className="text-white font-bold">12.4t</h4>
          <p className="text-emerald-500 text-xs font-bold">+12% vs sem. pass.</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Evolução Semanal</h2>
          <BarChart3 className="w-4 h-4 text-zinc-600" />
        </div>
        <div className="h-48 w-full bg-zinc-900/50 rounded-3xl p-4 border border-zinc-900">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs><linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Meus Treinos</h2>
          <Link href="/builder" className="p-2 bg-zinc-900 rounded-xl border border-zinc-800"><Plus className="w-4 h-4 text-white" /></Link>
        </div>
        <div className="space-y-3">
          {workouts.map((w) => (
            <Link key={w.id} href={`/workout/${w.id}`}>
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all"><Dumbbell className="w-5 h-5" /></div>
                  <div><h5 className="text-white text-sm font-bold">{w.name}</h5><p className="text-zinc-600 text-[10px] tracking-widest uppercase">{w.category}</p></div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Link>
          ))}
          {workouts.length === 0 && !loading && (<p className="text-center text-zinc-600 py-4 text-sm">Você ainda não tem treinos criados.</p>)}
        </div>
      </section>
    </div>
  );
}
