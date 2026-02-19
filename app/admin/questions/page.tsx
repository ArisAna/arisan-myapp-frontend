'use client';

import AdminRoute from '../../components/AdminRoute';
import { api } from '../../lib/api';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  question_text: string;
  correct_answer: string;
  category: string | null;
  created_at: string;
}

function QuestionsContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedMsg, setSeedMsg] = useState('');
  const [seeding, setSeeding] = useState(false);

  // New question form
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const loadQuestions = async () => {
    try {
      const data = await api.getQuestions();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const data = await api.seedQuestions();
      setSeedMsg(data.message);
      loadQuestions();
    } catch (err) {
      setSeedMsg(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createQuestion(questionText, correctAnswer, category || undefined);
      setQuestionText('');
      setCorrectAnswer('');
      setCategory('');
      setShowForm(false);
      loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.question_text);
    setEditAnswer(q.correct_answer);
    setEditCategory(q.category || '');
  };

  const handleEdit = async (id: number) => {
    try {
      await api.updateQuestion(id, {
        question_text: editText,
        correct_answer: editAnswer,
        category: editCategory || undefined,
      });
      setEditingId(null);
      loadQuestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Questions ({questions.length})</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Admin
          </Link>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Question'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Default Questions'}
          </button>
        </div>

        {seedMsg && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">{seedMsg}</p>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200 space-y-4">
            {error && <p className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Question</label>
              <input
                type="text"
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                placeholder="What is the capital of...?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
              <input
                type="text"
                required
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                placeholder="Geography, Science, etc."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Question'}
            </button>
          </form>
        )}

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              {editingId === q.id ? (
                <div className="space-y-3">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                  />
                  <input
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                  />
                  <input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                    placeholder="Category"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(q.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{q.question_text}</p>
                      <p className="mt-1 text-sm text-green-700">Answer: {q.correct_answer}</p>
                      {q.category && (
                        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {q.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(q)}
                        className="text-xs text-blue-600 hover:text-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-xs text-red-600 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No questions yet. Click &quot;Seed Default Questions&quot; to add some.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function QuestionsPage() {
  return (
    <AdminRoute>
      <QuestionsContent />
    </AdminRoute>
  );
}
