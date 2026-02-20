'use client';

import AdminRoute from '../components/AdminRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Session {
  user_id: number;
  display_name: string;
  email: string;
  is_admin: boolean;
  is_online: boolean;
  connection_count: number;
  connected_at: string | null;
  current_game: number | null;
}

function AdminContent() {
  const { user } = useAuth();
  const [migrateMsg, setMigrateMsg] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [kickingId, setKickingId] = useState<number | null>(null);
  const [sessionsError, setSessionsError] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.getSessions();
      setSessions(data.sessions);
      setSessionsError('');
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMsg('');
    try {
      const data = await api.migrateGameTables();
      setMigrateMsg(data.message);
    } catch (err) {
      setMigrateMsg(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleKick = async (userId: number, displayName: string) => {
    if (!confirm(`Αποσύνδεση χρήστη "${displayName}";`)) return;
    setKickingId(userId);
    setSessionsError('');
    try {
      await api.kickUser(userId);
      setSessions(prev => prev.filter(s => s.user_id !== userId));
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to kick user');
    } finally {
      setKickingId(null);
    }
  };

  function formatConnectedAt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Dashboard
          </Link>
        </div>

        <p className="mb-6 text-sm text-gray-600">Logged in as {user?.display_name} (admin)</p>

        <div className="space-y-4">
          <Link
            href="/admin/questions"
            className="block rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-900">Manage Questions</h2>
            <p className="mt-1 text-sm text-gray-600">Add, edit, delete, and seed trivia questions</p>
          </Link>

          {/* Active Sessions */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
                <p className="text-sm text-gray-500 mt-0.5">Currently connected via socket · refreshes every 10s</p>
              </div>
              <button
                onClick={loadSessions}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Refresh
              </button>
            </div>

            {sessionsError && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{sessionsError}</p>
            )}

            {sessionsLoading ? (
              <p className="text-sm text-gray-400">Φόρτωση...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Κανένας εγγεγραμμένος χρήστης</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div
                    key={s.user_id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      s.is_online ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${s.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium text-gray-900 text-sm">{s.display_name}</span>
                        {s.is_admin && (
                          <span className="text-xs text-blue-500 font-medium">admin</span>
                        )}
                        {s.user_id === user?.id && (
                          <span className="text-xs text-gray-400">(εσύ)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 pl-4">
                        {s.is_online
                          ? <>
                              {s.current_game ? `Παιχνίδι #${s.current_game}` : 'Lobby / άλλη σελίδα'}
                              {' · Από '}{formatConnectedAt(s.connected_at!)}
                              {s.connection_count > 1 && ` · ${s.connection_count} tabs`}
                            </>
                          : 'Εκτός σύνδεσης'
                        }
                      </p>
                    </div>
                    {s.is_online && s.user_id !== user?.id && (
                      <button
                        onClick={() => handleKick(s.user_id, s.display_name)}
                        disabled={kickingId === s.user_id}
                        className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {kickingId === s.user_id ? '...' : 'Kick'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database migrations */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Database</h2>
            <p className="mt-1 text-sm text-gray-600 mb-4">Run migrations to create or update game tables</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {migrating ? 'Running...' : 'Game Tables'}
              </button>
              <button
                onClick={async () => {
                  setMigrating(true);
                  setMigrateMsg('');
                  try {
                    const data = await api.migrateGameEndConditions();
                    setMigrateMsg(data.message);
                  } catch (err) {
                    setMigrateMsg(err instanceof Error ? err.message : 'Migration failed');
                  } finally {
                    setMigrating(false);
                  }
                }}
                disabled={migrating}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {migrating ? 'Running...' : 'Game End Conditions'}
              </button>
            </div>
            {migrateMsg && (
              <p className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded">{migrateMsg}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
