const API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://api.arisan.gr/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, display_name: string) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name }),
    }),

  getMe: () => fetchAPI('/auth/me'),

  // Admin
  getUsers: () => fetchAPI('/admin/users'),
  toggleAdmin: (userId: number) =>
    fetchAPI(`/admin/users/${userId}/toggle-admin`, { method: 'POST' }),
  getSessions: () => fetchAPI('/admin/sessions'),
  kickUser: (userId: number) =>
    fetchAPI(`/admin/users/${userId}/kick`, { method: 'POST' }),

  // Migrations
  migrateGameTables: () =>
    fetchAPI('/migrate/game-tables', { method: 'POST' }),
  migrateGameEndConditions: () =>
    fetchAPI('/migrate/game-end-conditions', { method: 'POST' }),

  // Questions
  getCategories: () => fetchAPI('/questions/categories'),
  getQuestions: (category?: string) =>
    fetchAPI(`/questions${category ? `?category=${category}` : ''}`),
  createQuestion: (question_text: string, correct_answer: string, category?: string) =>
    fetchAPI('/questions', {
      method: 'POST',
      body: JSON.stringify({ question_text, correct_answer, category }),
    }),
  seedQuestions: () =>
    fetchAPI('/questions/seed', { method: 'POST' }),
  updateQuestion: (id: number, data: { question_text?: string; correct_answer?: string; category?: string }) =>
    fetchAPI(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteQuestion: (id: number) =>
    fetchAPI(`/questions/${id}`, { method: 'DELETE' }),
  deleteAllQuestions: () =>
    fetchAPI('/questions', { method: 'DELETE' }),

  // Games
  getGames: () => fetchAPI('/games'),
  getGame: (id: number) => fetchAPI(`/games/${id}`),
  createGame: (settings: { end_mode: 'cycles' | 'points'; cycles?: number; target_points?: number }) =>
    fetchAPI('/games', { method: 'POST', body: JSON.stringify(settings) }),
  joinGame: (id: number) => fetchAPI(`/games/${id}/join`, { method: 'POST' }),
  leaveGame: (id: number) => fetchAPI(`/games/${id}/leave`, { method: 'POST' }),
  startGame: (id: number) => fetchAPI(`/games/${id}/start`, { method: 'POST' }),
  deleteGame: (id: number) => fetchAPI(`/games/${id}`, { method: 'DELETE' }),

  // Gameplay
  getRound: (gameId: number) => fetchAPI(`/games/${gameId}/round`),
  getAvailableQuestions: (gameId: number, category?: string, exclude?: number[]) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (exclude?.length) params.set('exclude', exclude.join(','));
    const qs = params.toString();
    return fetchAPI(`/games/${gameId}/available-questions${qs ? `?${qs}` : ''}`);
  },
  pickQuestion: (gameId: number, questionId: number) =>
    fetchAPI(`/games/${gameId}/pick-question`, { method: 'POST', body: JSON.stringify({ question_id: questionId }) }),
  editGameQuestion: (gameId: number, questionId: number, data: { question_text?: string; correct_answer?: string }) =>
    fetchAPI(`/games/${gameId}/edit-question/${questionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  seedGameQuestions: (gameId: number) =>
    fetchAPI(`/games/${gameId}/seed-questions`, { method: 'POST' }),
  submitAnswer: (gameId: number, answerText: string) =>
    fetchAPI(`/games/${gameId}/answer`, { method: 'POST', body: JSON.stringify({ answer_text: answerText }) }),
  submitVote: (gameId: number, answerId: number) =>
    fetchAPI(`/games/${gameId}/vote`, { method: 'POST', body: JSON.stringify({ answer_id: answerId }) }),
  nextRound: (gameId: number) =>
    fetchAPI(`/games/${gameId}/next-round`, { method: 'POST' }),
};
