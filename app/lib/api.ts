const API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://api.arisan.gr/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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

  // Migrations
  migrateGameTables: () =>
    fetchAPI('/migrate/game-tables', { method: 'POST' }),

  // Questions
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
};
