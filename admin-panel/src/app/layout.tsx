'use client';

import { Toaster } from 'react-hot-toast';
import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('admin_token');
    const isLoginPage = pathname === '/login';

    if (!token && !isLoginPage) {
      // Redirect to login page if not authenticated
      router.push('/login');
    } else if (token && isLoginPage) {
      // Redirect to dashboard if already authenticated
      router.push('/');
    }
    
    setLoading(false);
  }, [pathname, router]);

  // Don't show sidebar/header on login page
  const isLoginPage = pathname === '/login';

  if (loading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" />
        {!isLoginPage ? (
          <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex pt-16 md:pt-0">
              <Sidebar />
              <div className="w-full min-h-screen flex-1 px-4 py-6 md:px-8 md:py-10 md:ml-64">
                {children}
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
