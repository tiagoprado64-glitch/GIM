'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Dumbbell, Edit2, Trash2, ChevronRight, Search, Filter, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkoutTemplate } from '@/lib/types';
import { PageContainer } from '@/components/layout/PageContainer';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function WorkoutList() {
  const { userData } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userData) return;
    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase.from('workouts').select('*').eq('user_id', userData.uid);
        if (error) throw error;
        setWorkouts((data || []).map(w => ({ id: w.id, name: w.name, category: w.category, daysOfWeek: w.days_of_week || [] })));
      } catch (error) { console.error('Fetch error:', error); }
      finally { setLoading(false); }
    };
    fetchWorkouts();
  }, [userData]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
      setWorkouts(prev => prev.filter(w => w.id !== id));
      setDeletingId(null);
    } catch (error) { console.error('Delete error:', error); alert('Erro ao excluir treino.'); }
    finally { setIsDeleting(false); }
  };

  const filteredWorkouts = workouts.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.category.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <PageContainer>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic">Meus Treinos</h1>
        <Link href="/builder" className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"><Plus className="w-5 h-5 text-white" /></Link>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" placeholder="Buscar treino ou categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-700 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm" />
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => (<div key={i} className="h-28 bg-zinc-900/50 rounded-3xl animate-pulse" />))}</div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="text-center py-20 space-y-6">
           <div className="p-6 bg-zinc-900 rounded-full w-fit mx-auto opacity-50"><Dumbbell className="w-10 h-10 text-zinc-500" /></div>
           <div className="space-y-2">
             <p className="text-zinc-600">Nenhum treino encontrado.</p>
             <Link href="/suggestions" className="flex items-center justify-center gap-2 text-indigo-400 font-bold bg-indigo-500/10 px-6 py-3 rounded-2xl"><Sparkles className="w-4 h-4" /> Sugerir treino com IA</Link>
           </div>
           <Link href="/builder" className="text-zinc-500 text-sm block">Criar manualmente</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((w) => (
            <motion.div key={w.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-[2rem] hover:border-zinc-700 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-indigo-400"><Dumbbell className="w-5 h-5" /></div>
                  <div><h3 className="text-white font-bold">{w.name}</h3><p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{w.category}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/builder?id=${w.id}`} className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></Link>
                  <button onClick={() => setDeletingId(w.id)} className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {DAYS.map((day, i) => (<div key={day} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-bold border ${w.daysOfWeek.includes(i) ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-zinc-800 text-zinc-800'}`}>{day}</div>))}
                </div>
                <Link href={`/workout/${w.id}`} className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-xl text-xs font-bold active:scale-95 transition-all">Iniciar<ChevronRight className="w-4 h-4" /></Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto"><Trash2 className="w-8 h-8 text-red-500" /></div>
            <div className="space-y-2"><h3 className="text-xl font-bold text-white uppercase italic">Excluir Treino?</h3><p className="text-zinc-500 text-sm">Esta ação não pode ser desfeita. Todos os dados deste treino serão perdidos.</p></div>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold text-zinc-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deletingId)} disabled={isDeleting} className="flex-1 py-4 bg-red-600 rounded-2xl font-bold text-white shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50">{isDeleting ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
}
