'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Target, User as UserIcon, Calendar, Scale, Ruler, Dumbbell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'gender', title: 'Qual seu gênero?', description: 'Isso nos ajuda a ajustar as recomendações de volume e intensidade.' },
  { id: 'age', title: 'Qual sua idade?', description: 'A idade influencia na recuperação e metabolismo.' },
  { id: 'biometrics', title: 'Peso e Altura', description: 'Esses dados são fundamentais para calcular seu IMC e necessidades calóricas.' },
  { id: 'objective', title: 'Seu objetivo principal', description: 'Para onde vamos direcionar seu esforço?' },
  { id: 'frequency', title: 'Frequência semanal', description: 'Quantos dias por semana você vai se dedicar?' }
];

const OBJECTIVES = [
  { id: 'weight-loss', label: 'Perca de Peso', icon: '🔥' },
  { id: 'muscle-gain', label: 'Ganho de Massa', icon: '💪' },
  { id: 'health', label: 'Saúde & Cardio', icon: '❤️' },
  { id: 'hypertrophy', label: 'Hipertrofia Rápida', icon: '⚡' },
  { id: 'strength', label: 'Força Bruta', icon: '🏗️' },
  { id: 'flexibility', label: 'Mobilidade', icon: '🧘' }
];

export default function OnboardingPage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ gender: '', age: 25, weight: 70, height: 170, objective: '', frequency: 3 });

  const handleNext = () => { if (step < STEPS.length - 1) { setStep(step + 1); } else { submitProfile(); } };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const submitProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ profile: formData, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Profile save error:', error);
        setIsSubmitting(false);
        return;
      }

      // Refresh userData in auth context so layout sees the profile
      await refreshUserData();
      router.push('/dashboard');
    } catch (error) {
      console.error('Profile save error:', error);
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500 flex flex-col">
      <div className="h-1 bg-zinc-900 w-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} className="h-full bg-indigo-500" />
      </div>

      <main className="flex-1 flex flex-col justify-center px-8 max-w-lg mx-auto w-full py-20">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="space-y-2">
              <span className="text-zinc-600 font-bold text-xs uppercase tracking-widest">Passo {step + 1} de {STEPS.length}</span>
              <h1 className="text-4xl font-bold tracking-tight italic uppercase leading-none">{currentStep.title}</h1>
              <p className="text-zinc-500 text-sm">{currentStep.description}</p>
            </div>

            <div className="py-4">
              {currentStep.id === 'gender' && (
                <div className="grid grid-cols-2 gap-4">
                  {['male', 'female', 'other'].map((g) => (
                    <button key={g} onClick={() => setFormData({ ...formData, gender: g })} className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${formData.gender === g ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                      <UserIcon className="w-8 h-8" />
                      <span className="font-bold uppercase text-xs">{g === 'male' ? 'Homem' : g === 'female' ? 'Mulher' : 'Outro'}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStep.id === 'age' && (
                <div className="flex flex-col items-center gap-8">
                  <div className="text-7xl font-black italic text-indigo-500">{formData.age}</div>
                  <input type="range" min="14" max="90" step="1" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  <div className="flex justify-between w-full text-zinc-600 font-bold text-[10px] uppercase"><span>14 anos</span><span>90 anos</span></div>
                </div>
              )}

              {currentStep.id === 'biometrics' && (
                <div className="space-y-12">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-tighter"><Scale className="w-4 h-4" /> Peso (kg)</div>
                         <div className="text-2xl font-bold bg-zinc-900 px-4 py-1 rounded-xl text-indigo-400">{formData.weight}</div>
                      </div>
                      <input type="range" min="40" max="200" value={formData.weight} onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})} className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-tighter"><Ruler className="w-4 h-4" /> Altura (cm)</div>
                         <div className="text-2xl font-bold bg-zinc-900 px-4 py-1 rounded-xl text-indigo-400">{formData.height}</div>
                      </div>
                      <input type="range" min="120" max="230" value={formData.height} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})} className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                   </div>
                </div>
              )}

              {currentStep.id === 'objective' && (
                <div className="grid grid-cols-2 gap-3">
                   {OBJECTIVES.map((obj) => (
                     <button key={obj.id} onClick={() => setFormData({...formData, objective: obj.id})} className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-start gap-3 ${formData.objective === obj.id ? 'bg-zinc-100 border-white text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                       <span className="text-2xl">{obj.icon}</span>
                       <span className="font-bold text-xs uppercase text-left">{obj.label}</span>
                     </button>
                   ))}
                </div>
              )}

              {currentStep.id === 'frequency' && (
                <div className="flex flex-col items-center gap-8">
                  <div className="text-7xl font-black italic text-indigo-500">{formData.frequency}x</div>
                  <div className="flex gap-2 w-full">
                    {[1,2,3,4,5,6,7].map(f => (
                      <button key={f} onClick={() => setFormData({...formData, frequency: f})} className={`flex-1 aspect-square rounded-2xl flex items-center justify-center font-black italic text-xl transition-all ${formData.frequency === f ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' : 'bg-zinc-900 text-zinc-700 hover:text-zinc-500'}`}>{f}</button>
                    ))}
                  </div>
                  <p className="text-zinc-600 text-xs font-bold uppercase">Dias por semana</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-8 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex gap-4">
        {step > 0 && (<button onClick={handleBack} className="p-5 bg-zinc-900 border border-zinc-800 text-white rounded-3xl active:scale-95 transition-all"><ChevronLeft className="w-6 h-6" /></button>)}
        <button onClick={handleNext} disabled={isSubmitting || (step === 0 && !formData.gender) || (step === 3 && !formData.objective)} className={`flex-1 py-5 rounded-3xl font-black italic uppercase tracking-tighter text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isSubmitting ? 'bg-zinc-800' : 'bg-white text-zinc-950 shadow-xl shadow-white/10'} disabled:opacity-50`}>
          {isSubmitting ? (<div className="w-6 h-6 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin" />) : (<>{step === STEPS.length - 1 ? 'Começar Jornada' : 'Próximo'}<ChevronRight className="w-5 h-5 fill-current" /></>)}
        </button>
      </footer>
    </div>
  );
}
