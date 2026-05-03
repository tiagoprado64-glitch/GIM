'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Dumbbell, History, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Dumbbell, label: 'Treino', href: '/workout' },
  { icon: History, label: 'Histórico', href: '/history' },
  { icon: User, label: 'Perfil', href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 pb-safe-area">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all",
                isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-12 h-1 bg-indigo-400 rounded-full" />
              )}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all text-zinc-500 hover:text-red-400"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Sair</span>
        </button>
      </div>
    </nav>
  );
}
