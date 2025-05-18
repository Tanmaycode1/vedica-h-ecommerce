'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Collections', href: '/collections', icon: TagIcon },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex h-16 flex-shrink-0 bg-white shadow">
        <button
          type="button"
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 justify-between px-4">
          <div className="flex flex-1 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">BigDeal</span>
              <span className="ml-2 text-lg font-semibold text-gray-900">Admin</span>
            </div>
          </div>
        </div>
      </div>

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex flex-shrink-0 items-center px-4">
                  <span className="text-2xl font-bold text-indigo-600">BigDeal</span>
                  <span className="ml-2 text-xl font-semibold text-gray-900">Admin</span>
                </div>
                <div className="mt-5 flex flex-1 flex-col">
                  <nav className="flex-1 space-y-1 px-2 pb-4">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href || 
                                      (item.href !== '/' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`
                            group flex items-center px-2 py-2 text-base font-medium rounded-md 
                            ${isActive
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`
                              mr-4 flex-shrink-0 h-6 w-6
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
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
} 