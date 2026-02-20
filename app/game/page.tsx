'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Player {
  user_id: number;
  display_name: string;
  turn_order: number;
  score: number;
}

interface Game {
  id: number;
  status: 'lobby' | 'in_progress' | 'finished';
  creator_name: string;
  created_by: number;
  current_round: number;
  players: Player[];
}

function GameContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('id');

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  const loadGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await api.getGame(Number(gameId));
      setGame(data.game);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      router.push('/lobby');
      return;
    }

    loadGame();

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = getSocket(token);
    socket.emit('join_game_room', Number(gameId));

    socket.on('game_updated', (updatedGame: Game) => {
      setGame(updatedGame);
    });

    socket.on('game_started', (updatedGame: Game) => {
      setGame(updatedGame);
      // Phase 3: navigate to gameplay
      // router.push(`/play?id=${gameId}`);
    });

    return () => {
      socket.emit('leave_game_room', Number(gameId));
      socket.off('game_updated');
      socket.off('game_started');
      disconnectSocket();
    };
  }, [gameId, loadGame, router]);

  const handleStart = async () => {
    if (!gameId) return;
    setStarting(true);
    setError('');
    try {
      await api.startGame(Number(gameId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    if (!gameId) return;
    setLeaving(true);
    try {
      await api.leaveGame(Number(gameId));
      router.push('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave game');
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Φόρτωση παιχνιδιού...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Το παιχνίδι δεν βρέθηκε.</p>
        <Link href="/lobby" className="text-blue-600 hover:text-blue-500">← Lobby</Link>
      </div>
    );
  }

  const isCreator = user?.id === game.created_by;
  const isAdmin = user?.is_admin;
  const canStart = (isCreator || isAdmin) && game.status === 'lobby' && game.players.length >= 3;
  const isInGame = game.players.some(p => p.user_id === user?.id);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Παιχνίδι #{game.id}</h1>
            <p className="text-sm text-gray-500">Δημιουργός: {game.creator_name}</p>
          </div>
          <Link href="/lobby" className="text-sm text-gray-500 hover:text-gray-700">
            ← Lobby
          </Link>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        {/* Status */}
        <div className="mb-6 rounded-xl bg-white border border-gray-200 p-5">
          {game.status === 'lobby' ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Αναμονή παικτών...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">Παιχνίδι σε εξέλιξη</span>
            </div>
          )}
        </div>

        {/* Players list */}
        <div className="mb-6 rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Παίκτες ({game.players.length})
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {game.players.map((player) => (
              <li key={player.user_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {player.turn_order}
                  </span>
                  <span className="font-medium text-gray-900">{player.display_name}</span>
                  {player.user_id === game.created_by && (
                    <span className="text-xs text-gray-400">(host)</span>
                  )}
                  {player.user_id === user?.id && (
                    <span className="text-xs text-blue-500">(εσύ)</span>
                  )}
                </div>
                {game.status === 'in_progress' && (
                  <span className="text-sm font-semibold text-gray-700">{player.score} pts</span>
                )}
              </li>
            ))}
            {game.players.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-gray-400">Κανένας παίκτης ακόμα</li>
            )}
          </ul>
        </div>

        {/* Actions */}
        {game.status === 'lobby' && (
          <div className="space-y-3">
            {canStart && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full rounded-xl bg-green-600 px-6 py-4 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {starting ? 'Εκκίνηση...' : 'Έναρξη Παιχνιδιού'}
              </button>
            )}
            {(isCreator || isAdmin) && game.players.length < 2 && (
              <p className="text-center text-sm text-gray-400">
                Χρειάζονται τουλάχιστον 3 παίκτες για να ξεκινήσει το παιχνίδι.
              </p>
            )}
            {isInGame && !isCreator && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-full rounded-xl border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {leaving ? 'Αποχώρηση...' : 'Αποχώρηση'}
              </button>
            )}
          </div>
        )}

        {game.status === 'in_progress' && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-blue-800 font-medium">Το παιχνίδι ξεκίνησε!</p>
            <p className="text-sm text-blue-600 mt-1">Γύρος {game.current_round}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Φόρτωση...</p></div>}>
        <GameContent />
      </Suspense>
    </ProtectedRoute>
  );
}
