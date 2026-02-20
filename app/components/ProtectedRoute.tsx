'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        <span className="text-xs font-medium text-slate-200 max-w-[140px] truncate">
          {user.display_name}
        </span>
      </div>
      {children}
    </>
  );
}
