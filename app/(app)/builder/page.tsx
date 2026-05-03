'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Plus, Trash2, Sparkles, ChevronUp, ChevronDown, Info, Play, RefreshCcw, X, Zap, TrendingUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { ai } from '@/lib/ai';
import { Type } from "@google/genai";
import type { Exercise } from '@/lib/types';

const CATEGORIES = ['Peito/Tríceps', 'Costas/Bíceps', 'Pernas/Ombro', 'Full Body', 'Cardio', 'Abs'];
const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function WorkoutBuilder() {
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('id');

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [isAlternativeLoading, setIsAlternativeLoading] = useState(false);

  useEffect(() => {
    if (workoutId && userData) {
      const loadWorkout = async () => {
        try {
          const { data: wData } = await supabase.from('workouts').select('*').eq('id', workoutId).single();
          if (wData) {
            setName(wData.name);
            setCategory(wData.category);
            setSelectedDays(wData.days_of_week || []);
          }
          const { data: eData } = await supabase.from('exercises').select('*').eq('workout_id', workoutId).order('order', { ascending: true });
          if (eData) {
            setExercises(eData.map(e => ({ id: e.id, name: e.name, order: e.order, weight: e.weight, reps: e.reps, sets: e.sets, restTime: e.rest_time, videoUrl: e.video_url })));
          }
        } catch (error) { console.error('Load workout error:', error); }
      };
      loadWorkout();
    }
  }, [workoutId, userData]);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  const addExercise = () => {
    const newEx: Exercise = { id: Math.random().toString(36).substr(2, 9), name: '', order: exercises.length, weight: 0, reps: 10, sets: 3, restTime: 60 };
    setExercises([...exercises, newEx]);
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id).map((ex, i) => ({ ...ex, order: i })));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newExercises.length) return;
    [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];
    setExercises(newExercises.map((ex, i) => ({ ...ex, order: i })));
  };

  const handleSave = async () => {
    if (!name || selectedDays.length === 0 || !userData) return;
    setIsSaving(true);
    try {
      const workoutData = { name, category, days_of_week: selectedDays, user_id: userData.uid, updated_at: new Date().toISOString() };
      let finalWorkoutId = workoutId;

      if (workoutId) {
        await supabase.from('workouts').update(workoutData).eq('id', workoutId);
      } else {
        const { data: newW } = await supabase.from('workouts').insert({ ...workoutData, created_at: new Date().toISOString() }).select('id').single();
        finalWorkoutId = newW?.id;
      }

      // Delete existing exercises and insert new ones
      if (workoutId) {
        await supabase.from('exercises').delete().eq('workout_id', workoutId);
      }

      if (exercises.length > 0 && finalWorkoutId) {
        const rows = exercises.map(ex => ({
          workout_id: finalWorkoutId,
          name: ex.name,
          order: ex.order,
          weight: ex.weight,
          reps: ex.reps,
          sets: ex.sets,
          rest_time: ex.restTime,
          video_url: ex.videoUrl || null,
        }));
        await supabase.from('exercises').insert(rows);
      }

      router.push('/dashboard');
    } catch (error) { console.error('Save error:', error); }
    finally { setIsSaving(false); }
  };

  const generateAiExercises = async () => {
    setIsAiLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) throw new Error('Chave de API Gemini não configurada');
      const profile = userData?.profile;
      const profileInfo = profile ? `Perfil do Usuário: Gênero: ${profile.gender}, Idade: ${profile.age} anos, Peso: ${profile.weight}kg, Altura: ${profile.height}cm, Objetivo: ${profile.objective}, Frequência: ${profile.frequency} dias/semana` : '';
      const prompt = `Gere um treino de academia detalhado e personalizado em Português. ${profileInfo} Nome do Treino Sugerido: ${name || 'Novo Treino'} Categoria: ${category} Objetivo: Sugira exercícios que façam sentido para esta categoria e perfil. Retorne um JSON com a lista de exercícios. Cada exercício deve ter: name (string), sets (number), reps (number), weight (number), restTime (number), videoUrl (string). Sugira de 5 a 8 exercícios.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { exercises: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, sets: { type: Type.NUMBER }, reps: { type: Type.NUMBER }, weight: { type: Type.NUMBER }, restTime: { type: Type.NUMBER }, videoUrl: { type: Type.STRING } }, required: ["name", "sets", "reps", "weight", "restTime"] } } }, required: ["exercises"] } }
      });
      const result = JSON.parse(response.text!);
      if (result.exercises && Array.isArray(result.exercises)) {
        setExercises(result.exercises.map((ex: any, i: number) => ({ id: Math.random().toString(36).substr(2, 9), name: ex.name || 'Exercício', sets: Number(ex.sets) || 3, reps: Number(ex.reps) || 10, weight: Number(ex.weight) || 0, restTime: Number(ex.restTime) || 60, videoUrl: ex.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " workout execution")}`, order: i })));
        if (!name) setName(category + ' Sugerido');
      }
    } catch (error) { console.error('AI Error:', error); alert('Erro ao gerar exercícios: Verifique sua conexão ou tente novamente mais tarde.'); }
    finally { setIsAiLoading(false); }
  };

  const getAlternatives = async (exercise: Exercise) => {
    setSwappingExerciseId(exercise.id);
    setIsAlternativeLoading(true);
    try {
      const prompt = `Sugira 3 exercícios alternativos para: "${exercise.name}". Objetivo: Substituir o exercício por outro que trabalhe o mesmo grupo muscular. Para cada alternativa, retorne: name, sets, reps, weight, restTime, videoUrl. Retorne APENAS o JSON: { "alternatives": [...] }`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { alternatives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, sets: { type: Type.NUMBER }, reps: { type: Type.NUMBER }, weight: { type: Type.NUMBER }, restTime: { type: Type.NUMBER }, videoUrl: { type: Type.STRING } } } } } } }
      });
      const result = JSON.parse(response.text!);
      setAlternatives(result.alternatives.map((alt: any) => ({ ...alt, videoUrl: alt.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(alt.name + " workout")}` })));
    } catch (error) { console.error('Alternative Error:', error); }
    finally { setIsAlternativeLoading(false); }
  };

  const swapExercise = (newEx: any) => {
    setExercises(prev => prev.map(ex => ex.id === swappingExerciseId ? { ...newEx, id: ex.id, order: ex.order } : ex));
    setSwappingExerciseId(null);
    setAlternatives([]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 space-y-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-bold text-white uppercase tracking-tight">{workoutId ? 'Editar Treino' : 'Novo Treino'}</h1>
        <button onClick={handleSave} disabled={!name || selectedDays.length === 0 || isSaving} className="text-indigo-400 font-bold disabled:opacity-50 disabled:grayscale">
          {isSaving ? <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
        </button>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Nome do Treino</label>
          <input type="text" placeholder="Ex: Peito e Tríceps A" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 outline-none focus:border-indigo-500/50 transition-all font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{cat}</button>))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Dias da Semana</label>
          <div className="flex justify-between gap-1">
            {DAYS.map((day, i) => (<button key={i} onClick={() => toggleDay(i)} className={`flex-1 aspect-square rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center ${selectedDays.includes(i) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{day}</button>))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Exercícios</h2>
          <div className="flex gap-2">
             <button onClick={generateAiExercises} disabled={isAiLoading} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 text-purple-400 rounded-xl border border-purple-500/20 text-xs font-bold hover:bg-purple-600/20 transition-all disabled:opacity-50">
               {isAiLoading ? <span className="animate-spin text-sm">↻</span> : <Sparkles className="w-3.5 h-3.5" />} AI Suggest
             </button>
             <button onClick={addExercise} className="p-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-white"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {exercises.map((ex, index) => (
              <motion.div key={ex.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveExercise(index, 'up')} className="text-zinc-600 hover:text-white disabled:opacity-30" disabled={index === 0}><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveExercise(index, 'down')} className="text-zinc-600 hover:text-white disabled:opacity-30" disabled={index === exercises.length - 1}><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <input type="text" placeholder="Nome do Exercício" value={ex.name} onChange={(e) => updateExercise(ex.id, 'name', e.target.value)} className="w-full bg-transparent text-white font-bold placeholder-zinc-700 outline-none" />
                    <div className="flex items-center gap-3">
                       {ex.videoUrl && (<a href={ex.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[8px] text-indigo-400 hover:text-indigo-300 font-bold uppercase"><Play className="w-2.5 h-2.5" /> Ver Tutorial</a>)}
                       <button onClick={() => getAlternatives(ex)} className="flex items-center gap-1 text-[8px] text-zinc-500 hover:text-indigo-400 font-bold uppercase transition-colors"><RefreshCcw className="w-2.5 h-2.5" /> Trocar</button>
                    </div>
                  </div>
                  <button onClick={() => removeExercise(ex.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1"><span className="text-[8px] text-zinc-500 uppercase font-bold block text-center">Séries</span><input type="number" value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl py-2 text-center text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><span className="text-[8px] text-zinc-500 uppercase font-bold block text-center">Reps</span><input type="number" value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl py-2 text-center text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><span className="text-[8px] text-zinc-500 uppercase font-bold block text-center">Peso (Kg)</span><input type="number" value={ex.weight} onChange={(e) => updateExercise(ex.id, 'weight', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl py-2 text-center text-xs text-white outline-none" /></div>
                  <div className="space-y-1"><span className="text-[8px] text-zinc-500 uppercase font-bold block text-center">Desc (s)</span><input type="number" value={ex.restTime} onChange={(e) => updateExercise(ex.id, 'restTime', parseInt(e.target.value) || 0)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl py-2 text-center text-xs text-white outline-none" /></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {exercises.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600 gap-4 border border-zinc-900 border-dashed rounded-3xl">
               <div className="p-4 bg-zinc-900 rounded-full"><Info className="w-8 h-8" /></div>
               <p className="text-sm">Clique no &quot;+&quot; ou use a IA para adicionar exercícios.</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {swappingExerciseId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div><h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">Trocar Exercício</h3><p className="text-zinc-500 text-[10px] font-bold uppercase">Sugestões de IA baseadas em biometria</p></div>
                <button onClick={() => setSwappingExerciseId(null)} className="p-2 bg-zinc-800 rounded-full"><X className="w-5 h-5 text-zinc-400" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                 {isAlternativeLoading ? (
                   <div className="py-20 flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-zinc-500 text-xs font-bold uppercase italic animate-pulse">Buscando alternativas...</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {alternatives.map((alt, i) => (
                       <div key={i} className="p-5 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 hover:border-indigo-500/50 transition-all group">
                         <div className="flex items-center justify-between mb-3">
                            <div><h4 className="text-white font-bold">{alt.name}</h4><div className="flex items-center gap-3"><span className="text-[10px] text-zinc-500 font-bold">{alt.sets}x{alt.reps}</span>{alt.videoUrl && (<a href={alt.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-bold uppercase"><Play className="w-2.5 h-2.5" /> Ver Vídeo</a>)}</div></div>
                            <button onClick={() => swapExercise(alt)} className="px-6 py-3 bg-white text-zinc-950 rounded-2xl font-black italic uppercase text-[10px] active:scale-95 transition-all">Trocar</button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
