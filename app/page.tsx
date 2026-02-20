'use client';

import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative text-center">
        {/* Logo / Title */}
        <div className="mb-2 inline-block rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-5 py-2">
          <span className="text-sm font-medium tracking-widest text-indigo-300 uppercase">Παιχνίδι αποπλάνησης</span>
        </div>
        <h1 className="mt-4 text-7xl font-black tracking-tight text-white sm:text-8xl">
          AKAMA<span className="text-indigo-400">!</span>
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-sm mx-auto leading-relaxed">
          Ξεγέλασε τους φίλους σου. Βρες την αλήθεια.<br />Κέρδισε τους πόντους.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-colors"
          >
            Σύνδεση
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-8 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            Δημιουργία Λογαριασμού
          </Link>
        </div>

        {/* How it works — quick teaser */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
          <div>
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xs text-slate-400 leading-snug">Διάλεξε ερώτηση</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🃏</div>
            <p className="text-xs text-slate-400 leading-snug">Ξεγέλασε τους άλλους</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xs text-slate-400 leading-snug">Μάζεψε πόντους</p>
          </div>
        </div>
      </div>
    </main>
  );
}
