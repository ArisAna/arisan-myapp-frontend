'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Game {
  id: number;
  status: 'lobby' | 'in_progress';
  creator_name: string;
  player_count: number;
  created_at: string;
  started_at: string | null;
}

function LobbyContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadGames = useCallback(async () => {
    try {
      const data = await api.getGames();
      setGames(data.games);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = getSocket(token);

    socket.emit('join_lobby');

    socket.on('lobby_updated', () => {
      loadGames();
    });

    return () => {
      socket.emit('leave_lobby');
      socket.off('lobby_updated');
      disconnectSocket();
    };
  }, [loadGames]);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const data = await api.createGame();
      router.push(`/game?id=${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setCreating(false);
    }
  };

  const handleJoin = async (gameId: number) => {
    try {
      await api.joinGame(gameId);
      router.push(`/game?id=${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Φόρτωση...</p>
      </div>
    );
  }

  const lobbyGames = games.filter(g => g.status === 'lobby');
  const activeGames = games.filter(g => g.status === 'in_progress');

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lobby</h1>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        {/* Create game (admin only) */}
        {user?.is_admin && (
          <div className="mb-8">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Δημιουργία...' : '+ Νέο Παιχνίδι'}
            </button>
          </div>
        )}

        {/* Open games */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Ανοιχτά Παιχνίδια ({lobbyGames.length})
          </h2>
          {lobbyGames.length === 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-400">
              Δεν υπάρχουν ανοιχτά παιχνίδια.
              {user?.is_admin && ' Δημιούργησε ένα!'}
            </div>
          ) : (
            <div className="space-y-3">
              {lobbyGames.map(game => (
                <div
                  key={game.id}
                  className="rounded-xl bg-white border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Παιχνίδι #{game.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Δημιούργησε: {game.creator_name} · {game.player_count} παίκτες
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoin(game.id)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white font-medium hover:bg-green-700 transition-colors"
                  >
                    Συμμετοχή
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* In-progress games */}
        {activeGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Παιχνίδια σε Εξέλιξη ({activeGames.length})
            </h2>
            <div className="space-y-3">
              {activeGames.map(game => (
                <div
                  key={game.id}
                  className="rounded-xl bg-white border border-gray-200 p-4 flex items-center justify-between opacity-75"
                >
                  <div>
                    <p className="font-medium text-gray-900">Παιχνίδι #{game.id}</p>
                    <p className="text-sm text-gray-500">
                      {game.creator_name} · {game.player_count} παίκτες · Σε εξέλιξη
                    </p>
                  </div>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    Σε εξέλιξη
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return (
    <ProtectedRoute>
      <LobbyContent />
    </ProtectedRoute>
  );
}
