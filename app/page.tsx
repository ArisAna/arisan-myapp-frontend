'use client';

import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">MyApp</h1>
        <p className="mt-4 text-lg text-gray-600">Welcome</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 font-medium hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
