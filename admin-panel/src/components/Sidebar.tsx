'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  TagIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3BottomLeftIcon,
  CreditCardIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Collections', href: '/collections', icon: TagIcon },
  { name: 'Mega Menu', href: '/mega-menu', icon: Bars3BottomLeftIcon },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-2xl font-bold text-indigo-600">BigDeal</span>
          <span className="ml-2 text-xl font-semibold text-gray-900">Admin</span>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                              (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md 
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6
                      ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button
            className="flex-shrink-0 w-full group block"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_token');
                window.location.href = '/login';
              }
            }}
          >
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Admin User
                </p>
                <div className="flex items-center text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  <ArrowLeftOnRectangleIcon className="mr-1 h-4 w-4" />
                  Logout
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 