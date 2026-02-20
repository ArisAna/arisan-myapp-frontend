'use client';

import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center px-4 py-16">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative text-center mt-8">
        <h1 className="text-7xl font-black tracking-tight text-white sm:text-8xl">
          AKAMA<span className="text-indigo-400">!</span>
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-sm mx-auto leading-relaxed">
          Ξεγέλασε τους φίλους σου. Βρες την αλήθεια.<br />Κέρδισε τους πόντους.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="cursor-pointer rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-colors"
          >
            Σύνδεση
          </Link>
          <Link
            href="/register"
            className="cursor-pointer rounded-xl border border-slate-600 bg-slate-800/60 px-8 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            Δημιουργία Λογαριασμού
          </Link>
        </div>

        {/* Quick icons */}
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

      {/* How to play */}
      <div className="relative w-full max-w-2xl mt-20">
        <h2 className="text-center text-xl font-bold text-white mb-8 tracking-wide uppercase opacity-70">
          ΠΩΣ ΠΑΙΖΕΤΑΙ
        </h2>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/40 p-5">
            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">1</div>
            <div>
              <p className="font-semibold text-white">Ο Question Master διαλέγει ερώτηση</p>
              <p className="text-sm text-slate-400 mt-1">Κάθε γύρο ένας παίκτης γίνεται Question Master (QM) με σειρά. Ο QM βλέπει μια λίστα ερωτήσεων και διαλέγει αυτήν που θέλει να παίξει.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/40 p-5">
            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">2</div>
            <div>
              <p className="font-semibold text-white">Όλοι γράφουν μια απάντηση</p>
              <p className="text-sm text-slate-400 mt-1">Οι υπόλοιποι παίκτες βλέπουν την ερώτηση και γράφουν μια απάντηση — αληθινή ή ψεύτικη. Στόχος: να ξεγελάσεις τους άλλους ώστε να ψηφίσουν τη δική σου απάντηση.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/40 p-5">
            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">3</div>
            <div>
              <p className="font-semibold text-white">Ψηφίζουν για την αληθινή απάντηση</p>
              <p className="text-sm text-slate-400 mt-1">Όλες οι απαντήσεις εμφανίζονται ανακατεμένες — μαζί με τη σωστή. Κάθε παίκτης ψηφίζει αυτή που πιστεύει ότι είναι αληθινή. Δεν ξέρεις ποια είναι ποιανού!</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 rounded-2xl bg-slate-800/50 border border-slate-700/40 p-5">
            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">4</div>
            <div>
              <p className="font-semibold text-white">Αποκάλυψη & Βαθμολογία</p>
              <p className="text-sm text-slate-400 mt-1">Αποκαλύπτεται ποιος έγραψε τι και πόσες ψήφους πήρε η κάθε απάντηση.</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-8 text-center rounded-full bg-green-500/20 text-green-400 font-bold text-xs py-0.5">+3</span>
                  <span className="text-slate-300">Αν μαντέψεις σωστά κατά τη φάση απαντήσεων</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-8 text-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs py-0.5">+2</span>
                  <span className="text-slate-300">Αν ψηφίσεις τη σωστή απάντηση</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-8 text-center rounded-full bg-violet-500/20 text-violet-400 font-bold text-xs py-0.5">+1</span>
                  <span className="text-slate-300">Για κάθε παίκτη που ψηφίζει τη δική σου ψεύτικη απάντηση</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-8 text-center rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-xs py-0.5">+3</span>
                  <span className="text-slate-300">Στον QM αν κανείς δεν βρει τη σωστή απάντηση</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Ο παίκτης με τους περισσότερους πόντους στο τέλος κερδίζει.
        </p>

        <div className="text-center mt-10">
          <button
            onClick={() => setStoryOpen(true)}
            className="cursor-pointer inline-flex items-center gap-2 text-amber-400/80 hover:text-amber-300 text-base font-medium tracking-wide transition-colors border-b border-amber-400/30 hover:border-amber-300/60 pb-0.5"
          >
            ✦ Η ιστορία του παιχνιδιού
          </button>
        </div>
      </div>

      {/* Origin Story Modal */}
      {storyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setStoryOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Papyrus card */}
          <div
            className="relative max-w-lg w-full rounded-2xl shadow-2xl px-8 pt-10 pb-8"
            style={{
              background: 'linear-gradient(160deg, #f5e6c8 0%, #ecdcb0 40%, #e8d49e 100%)',
              border: '2px solid #b8956a',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Wax seal flourish */}
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #c0392b, #7b1c1c)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  border: '1.5px solid #5a1010',
                }}
              >
                <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>✦</span>
              </div>
            </div>

            {/* Story text */}
            <div
              className="space-y-4 leading-relaxed"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#3b2a14',
              }}
            >
              <p className="italic text-[15px]">
                Μία κρύα βραδιά, σε ένα χωριό με το όνομα Πευκόφυτο, μια παρέα πέντε συγγενών και φίλων — με ένα παλαιωμένο ρούμι στο χέρι, μπροστά σε ένα τζάκι που οι φλόγες του ζέσταιναν ολόκληρο το σπίτι — παρακολουθούσαν από το παράθυρο την πυκνή ομίχλη να σκεπάζει τον κόσμο γύρω τους.
              </p>
              <p className="italic text-[15px]">
                Εκείνο το βράδυ αποφάσισαν να φτιάξουν κάτι δικό τους: ένα παιχνίδι που προσφέρει διασκέδαση και γέλιο, που χρειάζεται στρατηγική και γνώσεις — αλλά κυρίως, να ξέρεις καλά τους ανθρώπους δίπλα σου...
              </p>
              <p className="italic text-[15px] font-semibold text-center pt-2" style={{ color: '#5a2d0c' }}>
                Το AKAMA! γεννήθηκε εκείνη τη νύχτα.
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setStoryOpen(false)}
              className="cursor-pointer absolute top-3 right-4 text-xl leading-none transition-opacity hover:opacity-60"
              style={{ color: '#7a5c3a' }}
              aria-label="Κλείσιμο"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
