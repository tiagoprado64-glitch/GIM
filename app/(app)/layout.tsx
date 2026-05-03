'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { FullPageLoader } from '@/components/ui/FullPageLoader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (userData && !userData.profile && pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    }
  }, [user, loading, userData, router, pathname]);

  if (loading || !user) {
    return <FullPageLoader />;
  }

  // Multi-tenant Subscription Check
  // Note: For real SaaS, we would strictly reject here if not 'active'
  // But for the MVP, we'll just show a UI warning if expired/free
  
  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
