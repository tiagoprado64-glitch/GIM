'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Dumbbell, CheckCircle2, ChevronRight, TrendingUp, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { ExecutionLog } from '@/lib/types';
import { PageContainer } from '@/components/layout/PageContainer';

export default function HistoryPage() {
  const { userData } = useAuth();
  const [history, setHistory] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;
    const fetchHistory = async () => {
      try {
        // Fetch executions
        const { data: execData, error } = await supabase
          .from('executions')
          .select('*')
          .eq('user_id', userData.uid)
          .order('date', { ascending: false });

        if (error) throw error;

        // Fetch workout names for each execution
        const enriched = await Promise.all((execData || []).map(async (ex) => {
          const { data: wData } = await supabase.from('workouts').select('name').eq('id', ex.workout_id).single();
          return {
            id: ex.id,
            workoutId: ex.workout_id,
            date: ex.date,
            data: ex.data,
            duration: ex.duration,
            workoutName: wData?.name || 'Treino Deletado',
          };
        }));

        setHistory(enriched);
      } catch (error) { console.error('History fetch error:', error); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [userData]);

  // Group history by month
  const grouped = history.reduce((acc, ex) => {
    const month = format(new Date(ex.date), "MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[month]) acc[month] = [];
    acc[month].push(ex);
    return acc;
  }, {} as Record<string, ExecutionLog[]>);

  return (
    <PageContainer>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">Histórico</h1>
        <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
           <HistoryIcon className="w-5 h-5 text-indigo-400" />
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (<div key={i} className="h-20 bg-zinc-900/50 rounded-2xl animate-pulse" />))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 space-y-4">
           <div className="p-6 bg-zinc-900 rounded-full w-fit mx-auto opacity-50"><Calendar className="w-10 h-10 text-zinc-500" /></div>
           <p className="text-zinc-600">Nenhum treino realizado ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => (
            <section key={month} className="space-y-4">
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{month}</h2>
              <div className="space-y-3">
                {items.map((ex) => (
                  <div key={ex.id} className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                        <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">{format(new Date(ex.date), 'EEE', { locale: ptBR })}</span>
                        <span className="text-lg font-bold">{format(new Date(ex.date), 'dd')}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{ex.workoutName}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase"><TrendingUp className="w-3 h-3" /> 8.5t</div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> 100%</div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-indigo-400" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
