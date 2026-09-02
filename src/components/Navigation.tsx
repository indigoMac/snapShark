'use client';

import { UserButton, useUser, SignInButton, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { LogoIcon } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  ChevronDown,
  Scissors,
  Waves,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePaywall } from '@/hooks/usePaywall';

const navLinkClass = 'brand-nav-link';

export function Navigation() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { isPro } = usePaywall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        target.closest('[class*="cl-userButton"]') ||
        target.closest('[class*="cl-popover"]')
      ) {
        return;
      }
      setMobileMenuOpen(false);
      setToolsDropdownOpen(false);
    };
    if (mobileMenuOpen || toolsDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen, toolsDropdownOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="brand-nav relative z-30">
      <div className="container mx-auto max-w-full px-4">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <LogoIcon size="2xl" priority />
            <span className="brand-display truncate text-xl tracking-tight sm:text-2xl">
              <span className="text-[#e8f4f1]">Snap</span>
              <span className="text-[#7ec8c0]">Shark</span>
            </span>
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/logbook" className={navLinkClass}>
              Logbook
            </Link>
            <Link href="/underwater" className={navLinkClass}>
              Colour Fix
            </Link>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToolsDropdownOpen(!toolsDropdownOpen);
                }}
                className={`flex items-center gap-1 ${navLinkClass}`}
              >
                Tools
                <ChevronDown className="h-4 w-4" />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-60 border border-[rgb(126_200_192_/_0.2)] bg-[#06262f] shadow-xl">
                  <div className="py-2">
                    <Link
                      href="/underwater"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c5ddd8] transition-colors hover:bg-[rgb(126_200_192_/_0.08)] hover:text-[#e8f4f1]"
                    >
                      <Waves className="h-4 w-4 text-[#7ec8c0]" />
                      <div>
                        <div className="font-medium">Underwater Colour Fix</div>
                        <div className="text-xs text-[#7a9a95]">
                          Fix green/blue tints
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/background-removal"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c5ddd8] transition-colors hover:bg-[rgb(126_200_192_/_0.08)] hover:text-[#e8f4f1]"
                    >
                      <Scissors className="h-4 w-4 text-[#7ec8c0]" />
                      <div>
                        <div className="font-medium">Background Removal</div>
                        <div className="text-xs text-[#7a9a95]">
                          Clean cutouts in-browser
                        </div>
                      </div>
                    </Link>
                    <div className="mx-3 my-1 h-px bg-[rgb(126_200_192_/_0.15)]" />
                    <Link
                      href="/convert"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c5ddd8] transition-colors hover:bg-[rgb(126_200_192_/_0.08)] hover:text-[#e8f4f1]"
                    >
                      <Zap className="h-4 w-4 text-[#7ec8c0]" />
                      <div>
                        <div className="font-medium">Image Processor</div>
                        <div className="text-xs text-[#7a9a95]">
                          Resize, convert & optimize
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/examples" className={navLinkClass}>
              Examples
            </Link>
            <Link href="/about" className={navLinkClass}>
              About
            </Link>

            {!isPro && (
              <Link href="/pricing" className={navLinkClass}>
                Pricing
              </Link>
            )}

            {isSignedIn ? (
              <>
                <Link href="/account" className={navLinkClass}>
                  Account
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                    },
                  }}
                />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className={navLinkClass}>Sign In</button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="brand-nav-cta">Get Started</button>
                </SignInButton>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="h-10 w-10 text-[#9bb8b3] hover:bg-[rgb(126_200_192_/_0.1)] hover:text-[#e8f4f1]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-40 max-h-[min(32rem,calc(100dvh-4.5rem))] overflow-y-auto overscroll-contain border-b border-[rgb(126_200_192_/_0.14)] bg-[#031820] pb-[env(safe-area-inset-bottom)] md:hidden">
              <div className="px-4 py-4">
                <div className="flex flex-col space-y-1">
                  {[
                    { href: '/logbook', label: 'Logbook' },
                    { href: '/underwater', label: 'Colour Fix' },
                    { href: '/examples', label: 'Examples' },
                    { href: '/about', label: 'About' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center px-4 text-base font-medium text-[#e8f4f1] transition-colors hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="border-b border-[rgb(126_200_192_/_0.14)] pb-2 pt-2">
                    <h3 className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7ec8c0]">
                      Tools
                    </h3>
                    <Link
                      href="/underwater"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center gap-3 px-4 text-base font-medium text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      <Waves className="h-5 w-5 text-[#7ec8c0]" />
                      Underwater Colour Fix
                    </Link>
                    <Link
                      href="/background-removal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center gap-3 px-4 text-base font-medium text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      <Scissors className="h-5 w-5 text-[#7ec8c0]" />
                      Background Removal
                    </Link>
                    <Link
                      href="/convert"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center gap-3 px-4 text-base font-medium text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      <Zap className="h-5 w-5 text-[#7ec8c0]" />
                      Image Processor
                    </Link>
                  </div>

                  {!isPro && (
                    <Link
                      href="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center px-4 text-base font-medium text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      Pricing
                    </Link>
                  )}

                  {isSignedIn ? (
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-12 items-center px-4 text-base font-medium text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
                    >
                      Account
                    </Link>
                  ) : (
                    <>
                      <SignInButton mode="modal">
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex h-12 w-full items-center px-4 text-left text-base font-medium text-[#9bb8b3] hover:bg-[rgb(126_200_192_/_0.08)] hover:text-[#e8f4f1]"
                        >
                          Sign In
                        </button>
                      </SignInButton>
                      <SignInButton mode="modal">
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="brand-nav-cta mt-2 w-full"
                        >
                          Get Started
                        </button>
                      </SignInButton>
                    </>
                  )}

                  {isSignedIn && (
                    <div className="mt-2 border-t border-[rgb(126_200_192_/_0.14)] pt-4">
                      <div className="mb-4 flex items-center gap-3 px-3">
                        <div className="flex h-10 w-10 items-center justify-center bg-[#7ec8c0] text-lg font-bold text-[#06262f]">
                          {user?.firstName?.charAt(0) ||
                            user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                            'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#e8f4f1]">
                            {user?.firstName ||
                              user?.emailAddresses[0]?.emailAddress}
                          </p>
                          <p className="text-xs text-[#7a9a95]">
                            {isPro ? 'Pro Member' : 'Free Account'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="flex h-12 w-full items-center px-4 text-base font-medium text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
