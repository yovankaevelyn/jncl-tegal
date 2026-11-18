// app/page.js
'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto" />
      <p className="text-base font-medium text-gray-900">Loading...</p>
      <p className="text-sm text-gray-500">Redirecting to your dashboard</p>
    </div>
  </div>
);

export default function HomePage() {
  const { user, isReady, isApproved, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Tunggu sampai auth selesai (isReady = session + profile sudah diterima)
    if (!isReady) return;

    console.log('🔍 Auth Ready:', { user: !!user, isApproved, userRole });

    if (!user) {
      router.replace('/auth/signin');
      return;
    }

    if (!isApproved) {
      router.replace('/auth/pending-approval');
      return;
    }

    switch (userRole) {
      case 'Admin':
        router.replace('/dashboard/products');
        break;
      case 'Kasir':
        router.replace('/dashboard/kasir');
        break;
      case 'Gudang':
        router.replace('/dashboard/gudang');
        break;
      default:
        router.replace('/dashboard/products');
    }
  }, [isReady, user, isApproved, userRole, router]);

  return <LoadingScreen />;
}
