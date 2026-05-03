'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, TrendingUp, Cpu, Smartphone, CheckCircle2, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { FullPageLoader } from '@/components/ui/FullPageLoader';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Check session directly as a fallback
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace('/dashboard');
      }
    };

    if (user && !loading) {
      router.replace('/dashboard');
    } else if (!loading && !user) {
      checkSession();
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    // First check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      router.replace('/dashboard');
      return;
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">FitFlow<span className="text-indigo-500">SaaS</span></span>
        </div>
        <button 
          onClick={handleLogin}
          className="text-sm font-medium hover:text-indigo-400 transition-colors"
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <section className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-indigo-400 uppercase border border-indigo-400/20 rounded-full bg-indigo-400/5 mb-6">
              O futuro do seu treino está aqui
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Treine com <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Inteligência</span> Máxima
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Sistema SaaS mobile-first com IA para sugestão de exercícios, relatórios de evolução e controle total da sua rotina na palma da mão.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={handleLogin}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Começar Agora
              <ChevronRight className="w-5 h-5" />
            </button>
            <a 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded-2xl transition-all"
            >
              Ver Funcionalidades
            </a>
          </motion.div>
        </section>

        {/* Mockup Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
          <div className="p-8 md:p-12 relative z-20 flex flex-col justify-end h-full">
            <div className="flex items-center gap-4 mb-4">
               <TrendingUp className="text-indigo-400 w-8 h-8" />
               <h3 className="text-3xl font-bold text-white">Evolução em Tempo Real</h3>
            </div>
            <p className="text-zinc-400 max-w-md">Monitore cada repetição e cada quilo aumentado com gráficos dinâmicos e precisos.</p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <section id="features" className="py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Cpu className="w-8 h-8 text-indigo-400" />,
              title: "Sugestões por IA",
              desc: "Receba treinos adaptados aos seus objetivos usando modelos Gemini de última geração."
            },
            {
              icon: <Smartphone className="w-8 h-8 text-purple-400" />,
              title: "Mobile First",
              desc: "Desenvolvido especificamente para uso intenso dentro da academia, rápido e intuitivo."
            },
            {
              icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
              title: "Gráficos de Carga",
              desc: "Visualize sua força crescendo sessão a sessão com métricas detalhadas."
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 transition-all group"
            >
              <div className="mb-4 bg-zinc-900 p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Pricing/SaaS section */}
        <section className="py-20 text-center border-t border-zinc-900">
           <h2 className="text-4xl font-bold text-white mb-4">Planos Simples</h2>
           <p className="text-zinc-400 mb-12">Escolha o plano que melhor se adapta à sua rotina.</p>
           <div className="max-w-sm mx-auto p-8 rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-600/20 text-white relative overflow-hidden">
             <div className="absolute -top-10 -right-10 bg-indigo-400/20 w-40 h-40 rounded-full blur-3xl" />
             <h3 className="text-2xl font-bold mb-2">Pro</h3>
             <div className="text-5xl font-bold mb-6">R$ 19,90 <span className="text-lg font-normal opacity-70">/mês</span></div>
             <ul className="space-y-4 mb-8 text-left">
               <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-200" /> Sem limites de treinos</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-200" /> IA ilimitada</li>
               <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-200" /> Histórico completo</li>
             </ul>
             <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-zinc-100 transition-colors"
             >
                Assinar Agora
             </button>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>&copy; 2026 FitFlow SaaS. Desenvolvido com ❤️ para atletas.</p>
      </footer>
    </div>
  );
}
