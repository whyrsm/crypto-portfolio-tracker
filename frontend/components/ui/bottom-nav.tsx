'use client';

import { Home, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
      <div className="grid h-full max-w-lg grid-cols-2 mx-auto">
        <Link
          href="/"
          className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group ${pathname === '/' ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-sm">Home</span>
        </Link>
        <Link
          href="/stats"
          className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group ${pathname === '/stats' ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <BarChart2 className="w-6 h-6 mb-1" />
          <span className="text-sm">Stats</span>
        </Link>
      </div>
    </div>
  );
}