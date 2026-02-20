'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ games_played: number; wins: number } | null>(null);

  useEffect(() => {
    api.getStats().then(data => setStats(data.stats)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
          >
            Sign Out
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome, {user?.display_name}</h2>
          <p className="text-sm text-gray-600 mb-5"><span className="font-medium">Email:</span> {user?.email}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats ? stats.games_played : '—'}</p>
              <p className="text-sm text-gray-500 mt-1">Παιχνίδια</p>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">{stats ? stats.wins : '—'}</p>
              <p className="text-sm text-yellow-600 mt-1">Νίκες</p>
            </div>
          </div>
        </div>

        <Link
          href="/lobby"
          className="mt-4 block rounded-lg bg-blue-600 p-4 text-white text-center font-semibold hover:bg-blue-700 transition-colors"
        >
          🎮 Lobby
        </Link>

        {user?.is_admin && (
          <Link
            href="/admin"
            className="mt-3 block rounded-lg bg-gray-800 p-4 text-white text-center hover:bg-gray-700 transition-colors"
          >
            Admin Panel
          </Link>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
