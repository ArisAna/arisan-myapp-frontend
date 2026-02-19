'use client';

import AdminRoute from '../components/AdminRoute';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useState } from 'react';
import Link from 'next/link';

function AdminContent() {
  const { user } = useAuth();
  const [migrateMsg, setMigrateMsg] = useState('');
  const [migrating, setMigrating] = useState(false);

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

          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Database</h2>
            <p className="mt-1 text-sm text-gray-600 mb-4">Run migrations to create game tables</p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {migrating ? 'Running...' : 'Run Game Tables Migration'}
            </button>
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
