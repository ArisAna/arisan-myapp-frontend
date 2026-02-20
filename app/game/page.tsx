'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useState, useEffect, useCallback, Suspense, FormEvent } from 'react';
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
  total_rounds: number;
  players: Player[];
}

interface Answer {
  id: number;
  user_id: number | null;
  display_name: string | null;
  answer_text: string;
  is_correct: boolean;
  votes_received: number;
}

interface ScoreEntry {
  user_id: number;
  display_name: string;
  score: number;
}

interface Round {
  game: {
    current_round: number;
    total_rounds: number;
    status: string;
    end_mode: 'cycles' | 'points';
    cycles: number;
    target_points: number | null;
  };
  scores: ScoreEntry[];
  round_number: number;
  question_master_id: number;
  qm_name: string;
  status: 'picking' | 'answering' | 'voting' | 'results';
  question_text?: string;
  correct_answer?: string;
  answered_count: number;
  vote_count: number;
  answers: Answer[];
  my_answer: string | null;
  my_vote: number | null;
}

interface AvailableQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  category: string | null;
}

// ── Scoreboard ──────────────────────────────────────────────────────────────
function Scoreboard({ scores, currentUserId }: { scores: ScoreEntry[]; currentUserId: number }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Σκορ</p>
      </div>
      <ul className="divide-y divide-gray-100">
        {scores.map((s, i) => (
          <li key={s.user_id} className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
              <span className={`text-sm ${s.user_id === currentUserId ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                {s.display_name}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">{s.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Picking Phase ────────────────────────────────────────────────────────────
function PickingPhase({ gameId, round, userId }: { gameId: number; round: Round; userId: number }) {
  const [questions, setQuestions] = useState<AvailableQuestion[]>([]);
  const [shownIds, setShownIds] = useState<number[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [picking, setPicking] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState('');
  const [seedMsg, setSeedMsg] = useState('');
  const isQM = round.question_master_id === userId;

  const fetchQuestions = (category: string | undefined, excludeIds: number[], append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError('');
    api.getAvailableQuestions(gameId, category, excludeIds)
      .then(d => {
        const newQs: AvailableQuestion[] = d.questions;
        if (append) {
          setQuestions(prev => [...prev, ...newQs]);
          setShownIds(prev => [...prev, ...newQs.map((q: AvailableQuestion) => q.id)]);
        } else {
          setQuestions(newQs);
          setShownIds(newQs.map((q: AvailableQuestion) => q.id));
        }
        setHasMore(newQs.length === 6);
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => setError('Δεν ήρθαν ερωτήσεις'))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => {
    if (isQM) fetchQuestions(undefined, [], false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isQM]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setShownIds([]);
    fetchQuestions(cat || undefined, [], false);
  };

  const handleLoadMore = () => {
    fetchQuestions(selectedCategory || undefined, shownIds, true);
  };

  const handlePick = async (questionId: number) => {
    setPicking(true);
    setError('');
    try {
      await api.pickQuestion(gameId, questionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setPicking(false);
    }
  };

  const startEdit = (q: AvailableQuestion) => {
    setEditingId(q.id);
    setEditQuestion(q.question_text);
    setEditAnswer(q.correct_answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEdit = async (questionId: number) => {
    setSavingEdit(true);
    try {
      const updated = await api.editGameQuestion(gameId, questionId, {
        question_text: editQuestion,
        correct_answer: editAnswer,
      });
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, question_text: updated.question.question_text, correct_answer: updated.question.correct_answer }
          : q
      ));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    setError('');
    try {
      const result = await api.seedGameQuestions(gameId);
      setSeedMsg(result.message);
      // Reset and reload — new questions are newest so they'll appear first
      setShownIds([]);
      fetchQuestions(selectedCategory || undefined, [], false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating questions');
    } finally {
      setSeeding(false);
    }
  };

  if (!isQM) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-lg font-medium text-gray-700">
          Ο <span className="font-bold text-blue-600">{round.qm_name}</span> επιλέγει ερώτηση...
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {round.game.end_mode === 'points'
            ? `Γύρος ${round.round_number} · 🎯 ${round.game.target_points}pts`
            : `Γύρος ${round.round_number} από ${round.game.total_rounds}`}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-blue-800 font-semibold text-center">
          🎯 Είσαι ο Question Master! Επίλεξε ερώτηση.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex gap-2 mb-3">
        <select
          value={selectedCategory}
          onChange={e => handleCategoryChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Όλες οι κατηγορίες</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="shrink-0 rounded-lg bg-purple-600 px-3 py-2 text-xs text-white font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {seeding ? '⏳ AI...' : '✨ +10 AI'}
        </button>
      </div>

      {seedMsg && (
        <p className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{seedMsg}</p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400 py-6">Φόρτωση ερωτήσεων...</p>
      ) : questions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-400">Δεν υπάρχουν ερωτήσεις.</p>
          <p className="text-xs text-gray-400 mt-1">Δοκίμασε άλλη κατηγορία ή δημιούργησε με AI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
              {editingId === q.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-0.5 block">Ερώτηση</label>
                    <input
                      type="text"
                      value={editQuestion}
                      onChange={e => setEditQuestion(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-0.5 block">Σωστή απάντηση</label>
                    <input
                      type="text"
                      value={editAnswer}
                      onChange={e => setEditAnswer(e.target.value)}
                      className="w-full rounded-lg border border-green-400 px-3 py-2 text-sm text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(q.id)}
                      disabled={savingEdit}
                      className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs text-white font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {savingEdit ? 'Αποθήκευση...' : '✓ Αποθήκευση'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Άκυρο
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      {q.category && (
                        <span className="inline-block text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 mb-1">{q.category}</span>
                      )}
                      <p className="text-sm text-gray-800">{q.question_text}</p>
                    </div>
                    <button
                      onClick={() => startEdit(q)}
                      className="shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Επεξεργασία"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        ✓ {q.correct_answer}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePick(q.id)}
                      disabled={picking}
                      className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Επιλογή
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore || picking}
              className="w-full rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? 'Φόρτωση...' : '+ Περισσότερες ερωτήσεις'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Answering Phase ──────────────────────────────────────────────────────────
function AnsweringPhase({ gameId, round, userId, totalPlayers }: { gameId: number; round: Round; userId: number; totalPlayers: number }) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isQM = round.question_master_id === userId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.submitAnswer(gameId, answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 rounded-xl bg-gray-900 p-5 text-white">
        <p className="text-xs text-gray-400 mb-1">Ερώτηση</p>
        <p className="text-lg font-semibold">{round.question_text}</p>
      </div>

      {isQM ? (
        <div className="text-center py-6">
          <p className="text-gray-600">Περιμένεις απαντήσεις...</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {round.answered_count} / {totalPlayers - 1}
          </p>
        </div>
      ) : round.my_answer ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-gray-600">Απάντησες: <span className="font-semibold text-gray-900">&quot;{round.my_answer}&quot;</span></p>
          <p className="text-sm text-gray-400 mt-1">
            Περιμένεις τους άλλους... ({round.answered_count}/{totalPlayers - 1})
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Η απάντησή σου</label>
            <input
              type="text"
              required
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Γράψε την απάντησή σου..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !answer.trim()}
            className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Υποβολή...' : 'Υποβολή Απάντησης'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Voting Phase ─────────────────────────────────────────────────────────────
function VotingPhase({ gameId, round, userId, totalPlayers }: { gameId: number; round: Round; userId: number; totalPlayers: number }) {
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const isQM = round.question_master_id === userId;

  const handleVote = async (answerId: number) => {
    setVoting(true);
    setError('');
    try {
      await api.submitVote(gameId, answerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setVoting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 rounded-xl bg-gray-900 p-5 text-white">
        <p className="text-xs text-gray-400 mb-1">Ερώτηση</p>
        <p className="text-lg font-semibold">{round.question_text}</p>
      </div>

      {isQM ? (
        <div className="text-center py-6">
          <p className="text-gray-600">Οι παίκτες ψηφίζουν...</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {round.vote_count} / {totalPlayers - 1}
          </p>
        </div>
      ) : round.my_vote ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🗳️</div>
          <p className="text-gray-600">Ψήφισες!</p>
          <p className="text-sm text-gray-400 mt-1">
            Περιμένεις τους άλλους... ({round.vote_count}/{totalPlayers - 1})
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Ποια είναι η σωστή απάντηση;</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {round.answers.map(a => {
            const isMyAnswer = round.my_answer && a.answer_text === round.my_answer;
            return (
              <button
                key={a.id}
                onClick={() => handleVote(a.id)}
                disabled={voting || !!isMyAnswer}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors
                  ${isMyAnswer
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-800'
                  }`}
              >
                {a.answer_text}
                {isMyAnswer && <span className="ml-2 text-xs">(η δική σου)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Results Phase ─────────────────────────────────────────────────────────────
function ResultsPhase({ gameId, round, userId }: { gameId: number; round: Round; userId: number }) {
  const [advancing, setAdvancing] = useState(false);
  const isQM = round.question_master_id === userId;
  const isLastRound = round.game.end_mode === 'cycles' && round.game.current_round >= round.game.total_rounds;

  const handleNext = async () => {
    setAdvancing(true);
    try {
      await api.nextRound(gameId);
    } catch {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gray-900 p-5 text-white">
        <p className="text-xs text-gray-400 mb-1">Ερώτηση</p>
        <p className="text-lg font-semibold mb-3">{round.question_text}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-500 text-white rounded-full px-2 py-0.5">Σωστή</span>
          <span className="text-green-300 font-semibold">{round.correct_answer}</span>
        </div>
      </div>

      <div className="space-y-2">
        {round.answers.map(a => {
          const isActualCorrect = a.is_correct && !a.user_id;
          const isCorrectGuess = a.is_correct && !!a.user_id;
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-4 ${
                isActualCorrect
                  ? 'border-green-300 bg-green-50'
                  : isCorrectGuess
                  ? 'border-blue-300 bg-blue-50'
                  : a.votes_received > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.answer_text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isActualCorrect
                      ? '✅ Σωστή απάντηση'
                      : isCorrectGuess
                      ? `⚡ Βρήκε τη σωστή! · ${a.display_name} (+3)`
                      : `από: ${a.display_name || '?'}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {a.votes_received > 0 && (
                    <span className="text-sm font-bold text-gray-700">{a.votes_received} 🗳️</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isQM && (
        <button
          onClick={handleNext}
          disabled={advancing}
          className="w-full rounded-xl bg-blue-600 py-4 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 mt-2"
        >
          {advancing ? '...' : isLastRound ? '🏁 Τέλος Παιχνιδιού' : '➡️ Επόμενος Γύρος'}
        </button>
      )}
      {!isQM && (
        <p className="text-center text-sm text-gray-400">
          Περιμένεις τον {round.qm_name} να προχωρήσει...
        </p>
      )}
    </div>
  );
}

// ── Final Results ─────────────────────────────────────────────────────────────
function FinalResults({ scores }: { scores: ScoreEntry[] }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Τέλος Παιχνιδιού!</h2>
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        {scores.map((s, i) => (
          <div key={s.user_id} className={`flex items-center justify-between px-6 py-4 ${i < scores.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
              <span className="font-semibold text-gray-900">{s.display_name}</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{s.score} pts</span>
          </div>
        ))}
      </div>
      <Link href="/lobby" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700">
        Επιστροφή στο Lobby
      </Link>
    </div>
  );
}

// ── Main Game Page ────────────────────────────────────────────────────────────
function GameContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('id');

  const [game, setGame] = useState<Game | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [finalScores, setFinalScores] = useState<ScoreEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');

  const loadGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await api.getGame(Number(gameId));
      setGame(data.game);
      if (data.game.status === 'in_progress') {
        const roundData = await api.getRound(Number(gameId));
        setRound(roundData.round);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const loadRound = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await api.getRound(Number(gameId));
      setRound(data.round);
    } catch (err) {
      console.error('Failed to load round:', err);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) { router.push('/lobby'); return; }
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
      loadRound();
    });

    socket.on('reload_round', () => {
      loadRound();
    });

    socket.on('game_finished', ({ scores }: { scores: ScoreEntry[] }) => {
      setFinalScores(scores);
      setGame(prev => prev ? { ...prev, status: 'finished' } : prev);
    });

    socket.on('game_deleted', () => {
      router.push('/lobby');
    });

    return () => {
      socket.emit('leave_game_room', Number(gameId));
      socket.off('game_updated');
      socket.off('game_started');
      socket.off('reload_round');
      socket.off('game_finished');
      socket.off('game_deleted');
      disconnectSocket();
    };
  }, [gameId, loadGame, loadRound, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Φόρτωση...</p></div>;
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Το παιχνίδι δεν βρέθηκε.</p>
        <Link href="/lobby" className="text-blue-600">← Lobby</Link>
      </div>
    );
  }

  // ── Final results ──
  if (finalScores) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <FinalResults scores={finalScores} />
        </div>
      </main>
    );
  }

  // ── Lobby waiting room ──
  if (game.status === 'lobby') {
    const isCreator = user?.id === game.created_by;
    const isAdmin = user?.is_admin;
    const canStart = (isCreator || isAdmin) && game.players.length >= 3;
    const isInGame = game.players.some(p => p.user_id === user?.id);

    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Παιχνίδι #{game.id}</h1>
              <p className="text-sm text-gray-500">Δημιουργός: {game.creator_name}</p>
            </div>
            <Link href="/lobby" className="text-sm text-gray-500 hover:text-gray-700">← Lobby</Link>
          </div>

          {error && <p className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="mb-5 rounded-xl bg-white border border-gray-200 p-4">
            <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block mr-2 animate-pulse" />
            <span className="text-sm text-gray-600">Αναμονή παικτών...</span>
          </div>

          <div className="mb-5 rounded-xl bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Παίκτες ({game.players.length})</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {game.players.map(p => (
                <li key={p.user_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{p.turn_order}</span>
                  <span className="text-sm font-medium text-gray-900">{p.display_name}</span>
                  {p.user_id === game.created_by && <span className="text-xs text-gray-400">(host)</span>}
                  {p.user_id === user?.id && <span className="text-xs text-blue-500">(εσύ)</span>}
                </li>
              ))}
            </ul>
          </div>

          {canStart && (
            <button onClick={async () => { setStarting(true); try { await api.startGame(game.id); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); setStarting(false); } }}
              disabled={starting}
              className="w-full rounded-xl bg-green-600 py-4 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
              {starting ? 'Εκκίνηση...' : 'Έναρξη Παιχνιδιού'}
            </button>
          )}
          {(isCreator || isAdmin) && game.players.length < 3 && (
            <p className="text-center text-sm text-gray-400 mt-3">Χρειάζονται τουλάχιστον 3 παίκτες.</p>
          )}
          {isInGame && !isCreator && (
            <button onClick={async () => { setLeaving(true); try { await api.leaveGame(game.id); router.push('/lobby'); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); setLeaving(false); }}}
              disabled={leaving}
              className="w-full mt-3 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {leaving ? 'Αποχώρηση...' : 'Αποχώρηση'}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── Gameplay ──
  if (!round || !user) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Φόρτωση γύρου...</p></div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        {/* Round header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {round.game.end_mode === 'points'
                ? `Γύρος ${round.round_number} · 🎯 ${round.game.target_points}pts`
                : `Γύρος ${round.round_number}/${round.game.total_rounds}`}
            </h1>
            <p className="text-sm text-gray-500">
              QM: <span className="font-medium text-blue-600">{round.qm_name}</span>
              {round.question_master_id === user.id && ' (εσύ)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/lobby" className="text-xs text-gray-400 hover:text-gray-600">← Lobby</Link>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              round.status === 'picking' ? 'bg-yellow-100 text-yellow-800' :
              round.status === 'answering' ? 'bg-blue-100 text-blue-800' :
              round.status === 'voting' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {round.status === 'picking' ? 'Επιλογή' :
               round.status === 'answering' ? 'Απαντήσεις' :
               round.status === 'voting' ? 'Ψηφοφορία' : 'Αποτελέσματα'}
            </span>
          </div>
        </div>

        {/* Scoreboard */}
        <Scoreboard scores={round.scores} currentUserId={user.id} />

        {/* Round content */}
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          {round.status === 'picking' && (
            <PickingPhase gameId={game.id} round={round} userId={user.id} />
          )}
          {round.status === 'answering' && (
            <AnsweringPhase gameId={game.id} round={round} userId={user.id} totalPlayers={round.scores.length} />
          )}
          {round.status === 'voting' && (
            <VotingPhase gameId={game.id} round={round} userId={user.id} totalPlayers={round.scores.length} />
          )}
          {round.status === 'results' && (
            <ResultsPhase gameId={game.id} round={round} userId={user.id} />
          )}
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Φόρτωση...</p></div>}>
        <GameContent />
      </Suspense>
    </ProtectedRoute>
  );
}
