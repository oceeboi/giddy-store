'use client';
import { cn } from '@/lib/utils';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JSX } from 'react';

declare type NavigationRouteType = {
  name: string;
  href: string;
  icon?: JSX.Element;
};

const user_navigations_dashboard: NavigationRouteType[] = [
  {
    name: 'Orders',
    href: '/orders',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
    ),
  },
  {
    name: 'Address',
    href: '/address',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
  },
  {
    name: 'profile',
    href: '/profile',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    ),
  },
  {
    name: 'Logout',
    href: '/logout',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4.5 h-4.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
        />
      </svg>
    ),
  },
];

export function UserDashboardNav() {
  const pathname = usePathname();
  function is_active_link(href: string) {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  type Role = 'admin' | 'user' | 'moderator';

  const role: Role = 'admin';

  const user_navigation_items: NavigationRouteType[] =
    role === 'admin'
      ? [
          ...user_navigations_dashboard,
          {
            name: 'Admin',
            href: '/admin',
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4.5 h-4.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            ),
          },
        ]
      : user_navigations_dashboard;

  return (
    <div className="py-5.75 font-archivo border min-w-[33%] rounded-none">
      <div className="flex flex-col gap-5">
        {user_navigation_items.map((user_navigation_item, index) => {
          const is_active = is_active_link(user_navigation_item.href);
          return (
            <Link
              key={index}
              href={user_navigation_item.href}
              className={cn(
                'px-4 items-center hover:pl-6 hover:bg-[#f4f1ea] hover:border-l hover:border-l-black  hover:text-black text-[#7c818b] py-px flex gap-2',
                is_active && 'border-l text-black! border-l-black'
              )}
            >
              <div className="px-1">{user_navigation_item.icon}</div>
              <h4 className="text-xs uppercase font-medium">{user_navigation_item.name}</h4>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
