'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, CreditCard, LogOut, ChevronRight, Settings, ShieldCheck, Star, History, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageContainer } from '@/components/layout/PageContainer';

export default function Profile() {
  const { userData } = useAuth();
  const router = useRouter();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData?.uid, email: userData?.email }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) { console.error('Checkout error:', error); }
    finally { setIsCheckoutLoading(false); }
  };

  return (
    <PageContainer>
      <section className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] rotate-12 blur-xl opacity-20" />
          <div className="relative w-full h-full rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white"><User className="w-10 h-10" /></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{userData?.displayName}</h2>
          <p className="text-zinc-500 text-sm">{userData?.email}</p>
        </div>
      </section>

      <section className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Star className="w-20 h-20 text-indigo-500" /></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plano Atual</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${userData?.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {userData?.subscriptionStatus === 'active' ? 'Premium' : 'Free'}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">{userData?.subscriptionStatus === 'active' ? 'Acesso Total Liberado' : 'Acesso Limitado'}</h3>
            <p className="text-zinc-500 text-xs">{userData?.subscriptionStatus === 'active' ? 'Sua assinatura está ativa e renova automaticamente.' : 'Faça o upgrade para liberar treinos ilimitados e IA.'}</p>
          </div>
          {userData?.subscriptionStatus !== 'active' && (
            <button onClick={handleCheckout} disabled={isCheckoutLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              {isCheckoutLoading ? 'Carregando...' : 'Fazer Upgrade'}<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {[
          { icon: <CreditCard className="w-5 h-5" />, label: 'Pagamentos', color: 'text-indigo-400' },
          { icon: <ShieldCheck className="w-5 h-5" />, label: 'Privacidade', color: 'text-emerald-400' },
          { icon: <Settings className="w-5 h-5" />, label: 'Configurações', color: 'text-zinc-400' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-zinc-800 ${item.color}`}>{item.icon}</div>
              <span className="text-white text-sm font-bold">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-700" />
          </div>
        ))}
      </section>

      <button onClick={handleSignOut} className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
        <LogOut className="w-5 h-5" />Sair da Conta
      </button>

      <div className="text-center text-[10px] text-zinc-700 uppercase tracking-widest pt-4">Versão 1.0.0 Alpha</div>
    </PageContainer>
  );
}
