'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  Boxes,
  ShoppingCart,
  Receipt,
  Settings,
  Store,
  ChevronDown,
  Ghost,
  ShoppingBag,
  Users,
  FilePlus2Icon,
  Ruler,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  sub_nav_routes?: AdminNavItem[];
}

const ADMIN_NAVIGATION_ITEMS: AdminNavItem[] = [
  {
    name: 'Admin Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Users Carts',
    href: '/admin/carts',
    icon: ShoppingBag,
    sub_nav_routes: [
      {
        name: 'Abandoned',
        href: '/admin/carts/abandoned',
        icon: Ghost,
        exact: true,
      },
    ],
  },
  {
    name: 'User Managemnt',
    href: '/admin/users',
    icon: Users,
    exact: true,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    sub_nav_routes: [
      {
        name: 'Create product',
        href: '/admin/products/create',
        icon: FilePlus2Icon,
      },
      {
        name: 'Brands',
        href: '/admin/products/brands',
        icon: Tags,
        sub_nav_routes: [
          {
            name: 'Add a brand',
            href: '/admin/products/brands/create',
            icon: FilePlus2Icon,
          },
        ],
      },
      {
        name: 'Categories',
        href: '/admin/products/categories',
        icon: Layers,
        sub_nav_routes: [
          {
            name: 'Add a category',
            href: '/admin/products/categories/create',
            icon: FilePlus2Icon,
          },
        ],
      },
      {
        name: 'Collections',
        href: '/admin/products/collections',
        icon: Boxes,
        sub_nav_routes: [
          {
            name: 'Add a collection',
            href: '/admin/products/collections/create',
            icon: FilePlus2Icon,
          },
        ],
      },
      {
        name: 'Sizes',
        href: '/admin/products/sizes',
        icon: Ruler,
        sub_nav_routes: [
          {
            name: 'Add a size',
            href: '/admin/products/sizes/create',
            icon: FilePlus2Icon,
          },
        ],
      },
    ],
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: Receipt,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    name: 'Store Front',
    href: '/dashboard',
    icon: Store,
  },
];

interface NavItemProps {
  item: AdminNavItem;
  pathname: string;
  depth?: number;
}

function NavItem({ item, pathname, depth = 0 }: NavItemProps) {
  const Icon = item.icon;
  const hasSubNav = Boolean(item.sub_nav_routes?.length);

  // Exact match vs prefix match logic
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const isChildActive = item.sub_nav_routes?.some(
    (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
  );

  const [isOpen, setIsOpen] = useState(isActive || isChildActive);

  return (
    <div className="w-full font-archivo">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'group flex w-full items-center gap-3  px-3 py-2 text-sm font-medium transition-all duration-150 ease-in-out',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            isActive &&
              'bg-accent text-foreground font-semibold  border-l-2 border-primary rounded-l-none',
            depth > 0 && 'text-xs pl-8'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}
          />
          <span className="truncate">{item.name}</span>
        </Link>

        {hasSubNav && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={`Toggle ${item.name} sub-menu`}
            className="p-2 text-muted-foreground hover:text-foreground transition-transform duration-200"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {/* Nested Sub-navigation */}
      {hasSubNav && isOpen && (
        <div className="mt-1 flex flex-col gap-1 border-l border-border/50 ml-4 pl-2">
          {item.sub_nav_routes?.map((subItem) => (
            <NavItem key={subItem.href} item={subItem} pathname={pathname} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminDashboard_Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full min-w-[33%] rounded-none border border-border bg-card py-5.75 ">
      <div className="flex flex-col gap-1">
        {ADMIN_NAVIGATION_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
