//app/page.js
"use client";

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Loading screen component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
      <p className="text-base font-medium text-gray-900">Loading...</p>
      <p className="text-sm text-gray-500">Redirecting to your dashboard</p>
    </div>
  </div>
);

export default function HomePage() {
  const { user, isLoading, isApproved, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Tunggu sampai status loading selesai
    if (isLoading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

    console.log('🔍 Auth State:', { user: !!user, isApproved, userRole });

    // Jika pengguna TIDAK login, arahkan ke halaman sign-in
    if (!user) {
      console.log('❌ No user, redirecting to sign in');
      router.replace('/auth/signin');
      return;
    }

    // Jika pengguna sudah login TAPI belum disetujui (pending approval)
    if (user && !isApproved) {
      console.log('⏸️ User not approved, redirecting to pending approval');
      router.replace('/auth/pending-approval');
      return;
    }

    // ✅ PERBAIKAN: Role-based dashboard routing
    if (user && isApproved && userRole) {
      console.log('✅ User approved, role:', userRole);
      
      // Redirect berdasarkan role
      switch (userRole) {
        case 'Admin':
          console.log('👑 Redirecting Admin to /dashboard/products');
          router.replace('/dashboard/products');
          break;
        case 'Kasir':
          console.log('💰 Redirecting Kasir to /dashboard/kasir');
          router.replace('/dashboard/kasir');
          break;
        case 'Gudang':
          console.log('📦 Redirecting Gudang to /dashboard/gudang');
          router.replace('/dashboard/gudang');
          break;
        default:
          // Fallback untuk role yang tidak dikenal
          console.log('❓ Unknown role, redirecting to /dashboard/products');
          router.replace('/dashboard/products');
      }
      return;
    }

    // Fallback jika ada kondisi yang tidak tertangani
    if (user && isApproved && !userRole) {
      console.log('⚠️ User approved but no role, redirecting to products');
      router.replace('/dashboard/products');
    }
    
  }, [user, isLoading, isApproved, userRole, router]);

  // Tampilkan layar loading saat status autentikasi sedang diambil
  return <LoadingScreen />;
}
