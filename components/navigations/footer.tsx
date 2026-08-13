'use client';

import { STORE_DETAILS, STORE_SOCIALS } from '@/constants/store-details';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React, { JSX, useState } from 'react';
import { z } from 'zod';
import { Accordion } from '../shared/accordion';
import { usePathname } from 'next/navigation';

type NavigationType = {
  name: string;
  href: string;
  icon?: JSX.Element;
  external?: boolean;
};

const quick_navigation: NavigationType[] = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Shop now',
    href: '/shop',
  },
  {
    name: 'Best sellers',
    href: '/best-sellers',
  },
  {
    name: 'Contact us',
    href: '/contact-us',
  },
];

const legal_navigations: NavigationType[] = [
  {
    name: `${STORE_DETAILS.name} Verified`,
    href: '/verification',
  },
  {
    name: 'Privacy Policy',
    href: '/privacy-policy',
  },
  {
    name: 'Refund & Returns',
    href: '/refund-return-policy',
  },
  {
    name: 'Terms of use',
    href: '/terms-of-use',
  },
];

const company_navigations: NavigationType[] = [
  {
    name: 'About Us',
    href: '/about-us',
  },
  {
    name: 'Locate Store',
    href: '/our-locations',
  },
];

const social_navigations: NavigationType[] = STORE_SOCIALS.map((social) => ({
  name: social.name,
  href: social.url,
  external: true,
  icon: <span dangerouslySetInnerHTML={{ __html: social.icon }} />,
}));

const footer_link_sections: { key: string; title: string; links: NavigationType[] }[] = [
  {
    key: 'quick-links',
    title: 'Quick Links',
    links: quick_navigation,
  },
  {
    key: 'legal',
    title: 'Legal',
    links: legal_navigations,
  },
  {
    key: 'company',
    title: 'Company',
    links: company_navigations,
  },
  {
    key: 'connect',
    title: 'Connect',
    links: social_navigations,
  },
];

function is_active_link(current_path: string, href: string, is_external = false) {
  if (is_external || !href.startsWith('/')) {
    return false;
  }

  if (href === '/') {
    return current_path === '/';
  }

  return current_path === href || current_path.startsWith(`${href}/`);
}

function Footer_links({
  pathname,
  navigations,
  with_indent = false,
}: {
  pathname: string;
  navigations: NavigationType[];
  with_indent?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-0.5', with_indent && 'pl-8.25')}>
      {navigations.map((navigation) => {
        const is_active = is_active_link(pathname, navigation.href, navigation.external);
        const is_external = navigation.external || !navigation.href.startsWith('/');

        return (
          <Link
            key={navigation.href}
            href={navigation.href}
            aria-current={is_active ? 'page' : undefined}
            target={is_external ? '_blank' : undefined}
            rel={is_external ? 'noopener noreferrer' : undefined}
            className={cn(
              'group relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
              is_active ? 'text-white' : 'text-white/60 hover:text-white'
            )}
          >
            {navigation.icon ? <span>{navigation.icon}</span> : null}
            <span className="capitalize">{navigation.name}</span>
            <span
              className={cn(
                'absolute inset-x-3 bottom-0.5 h-0.5 origin-center rounded-full bg-white transition-transform duration-150',
                is_active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}

// Define the Zod schema for email validation
const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
});

export function Footer() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate input using Zod
    const result = newsletterSchema.safeParse({ email });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    // Simulate API call / submission handler
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setEmail('');
    }, 1000);
  };

  const details = STORE_DETAILS;
  const pathname = usePathname() ?? '/';

  return (
    <section>
      <section className="bg-black flex flex-col gap-12 px-6 md:px-20 py-20 md:py-30 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div>
            <h3 className="font-ibm-plex-mono text-xs lg:text-sm tracking-widest text-[#888888]">
              [ JOIN THE MOVEMENT ]
            </h3>
          </div>
          <div>
            <h3 className="font-archivo-black text-2xl lg:text-5xl uppercase tracking-tight">
              STAY INTEGRATED
            </h3>
          </div>
          <div>
            <p className="text-[#888888] font-archivo text-sm lg:text-base max-w-md">
              Be first to know about new drops and exclusive access.
            </p>
          </div>
        </div>

        <div className="flex w-full justify-center items-center">
          <form onSubmit={handleSubmit} className="flex  flex-col items-center w-full max-w-xl">
            <div className="flex w-full flex-col sm:flex-row justify-center gap-3 sm:gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className={`border bg-transparent font-archivo lg:w-102.75 w-full py-4 px-6 text-white placeholder:text-[#666666] focus:outline-none transition-colors ${
                  error ? 'border-red-500' : 'border-neutral-700 focus:border-white'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-white hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer px-8 py-4 sm:py-0 flex items-center justify-center"
              >
                <p className="text-black font-archivo-black text-xs tracking-wider">
                  {isLoading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
                </p>
              </button>
            </div>

            {/* Validation Error Feedback */}
            {error && (
              <p className="text-red-500 font-archivo text-xs mt-3 self-start sm:ml-1 animate-fadeIn">
                {error}
              </p>
            )}

            {/* Success Feedback */}
            {success && (
              <p className="text-green-400 font-archivo text-xs mt-3 self-start sm:ml-1 animate-fadeIn">
                Successfully subscribed! Welcome to the movement.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="pt-25 pb-16 bg-black px-6 lg:px-20 border-t border-neutral-900">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_repeat(4,minmax(0,1fr))] lg:gap-8 items-start">
          {/* Brand Column */}
          <div className="pt-2">
            <div className="py-4">
              <h4 className="text-[20px] lg:text-[32px] font-archivo-black text-white uppercase tracking-tight">
                {details.name}
              </h4>
            </div>
            <div className="mb-6">
              <p className="text-sm font-archivo text-[#888888] leading-relaxed">
                At {details.name}, we believe sneakers are an expression of culture, style, and
                identity. As a premier destination for authentic luxury footwear, our collection
                features only the finest Jordans, Dunks, Air Forces, and rare, limited-edition Nike
                releases. Sourced strictly from a trusted network of global partners, we guarantee
                100% authenticity so you can step out with absolute confidence.
              </p>
            </div>
            <div className="w-full border-b border-neutral-800 pt-2 lg:hidden" />
          </div>

          {/* Desktop Navigation Links Columns */}
          {footer_link_sections.map((section) => {
            return (
              <div key={section.key} className="hidden font-archivo pt-2 lg:block">
                <div className="py-4 font-archivo">
                  <h4 className="text-[15px] font-archivo-black text-white tracking-wider uppercase">
                    {section.title}
                  </h4>
                </div>
                <Footer_links pathname={pathname} navigations={section.links} />
              </div>
            );
          })}
        </div>

        {/* Mobile Accordion Navigation */}
        <section className="pt-4 font-archivo lg:hidden">
          <div className="mx-auto w-full px-0">
            <Accordion type="single" collapsible>
              {footer_link_sections.map((section) => {
                return (
                  <Accordion.Item
                    key={section.key}
                    value={section.key}
                    className="border-b border-neutral-900"
                  >
                    <Accordion.Trigger className="py-4 hover:no-underline">
                      <p className="text-white font-archivo-black text-sm tracking-wider uppercase">
                        {section.title}
                      </p>
                    </Accordion.Trigger>
                    <Accordion.Content className="text-white pb-4">
                      <Footer_links pathname={pathname} navigations={section.links} with_indent />
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </div>
        </section>
        <section className="pt-6 lg:border-t lg:border-[#141414] flex items-center justify-center lg:justify-start">
          <h3 className="text-[#666666] uppercase font-archivo text-[11px]">
            © 2026 {details.name}. ALL RIGHTS RESERVED.
          </h3>
        </section>
      </section>
    </section>
  );
}
