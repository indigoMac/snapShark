'use client';

import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { LogoIcon } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Scissors,
  Waves,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePaywall } from '@/hooks/usePaywall';

export function Navigation() {
  const { isSignedIn, user } = useUser();
  const { theme, setTheme } = useTheme();
  const { isPro } = usePaywall();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when clicking outside or on links
  useEffect(() => {
    const handleClickOutside = () => {
      setMobileMenuOpen(false);
      setToolsDropdownOpen(false);
    };
    if (mobileMenuOpen || toolsDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen, toolsDropdownOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="relative z-30 border-b border-blue-200/50 dark:border-blue-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <LogoIcon size="2xl" priority />
            <span className="font-bold text-xl sm:text-2xl lg:text-3xl">
              <span className="text-slate-800 dark:text-slate-100">Snap</span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                Shark
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToolsDropdownOpen(!toolsDropdownOpen);
                }}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
              >
                Tools
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Tools Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-40">
                  <div className="py-2">
                    <Link
                      href="/"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <Zap className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Image Processor</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Resize, convert & optimize
                        </div>
                      </div>
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2 my-1"></div>
                    <Link
                      href="/background-removal"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <Scissors className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Background Removal</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          AI-powered precision
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/underwater"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <Waves className="w-4 h-4 text-cyan-600" />
                      <div>
                        <div className="font-medium">Underwater Color Fix</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Fix green/blue tints
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/examples"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              Examples
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              About
            </Link>

            {/* Conditional Pricing - Hide for Pro users */}
            {!isPro && (
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
              >
                Pricing
              </Link>
            )}

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  Account
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    },
                  }}
                />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Started
                  </button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme toggle for mobile */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="h-10 w-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50"
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

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Content */}
            <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-blue-200/50 dark:border-blue-800/50 shadow-xl z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-4 py-4">
                <div className="flex flex-col space-y-2">
                  {/* Tools Section */}
                  <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 pb-2">
                      Tools
                    </h3>
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <Zap className="w-5 h-5 text-blue-600" />
                      Image Processor
                    </Link>
                    <Link
                      href="/background-removal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <Scissors className="w-5 h-5 text-purple-600" />
                      Background Removal
                    </Link>
                    <Link
                      href="/underwater"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <Waves className="w-5 h-5 text-cyan-600" />
                      Underwater Color Fix
                    </Link>
                  </div>

                  {/* Other Navigation Links */}
                  <Link
                    href="/examples"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    📸 Examples
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    ℹ️ About
                  </Link>

                  {/* Conditional Pricing for Mobile */}
                  {!isPro && (
                    <Link
                      href="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      💰 Pricing
                    </Link>
                  )}

                  {isSignedIn ? (
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center h-12 px-4 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      👤 Account
                    </Link>
                  ) : (
                    <>
                      <SignInButton mode="modal">
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center h-12 px-3 w-full text-left text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                        >
                          🔐 Sign In
                        </button>
                      </SignInButton>
                      <SignInButton mode="modal">
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          🚀 Get Started
                        </button>
                      </SignInButton>
                    </>
                  )}

                  {/* User info for signed-in users */}
                  {isSignedIn && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 px-3">
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: 'w-10 h-10',
                            },
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {user?.firstName ||
                              user?.emailAddresses[0]?.emailAddress}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isPro ? 'Pro Member' : 'Free Account'}
                          </p>
                        </div>
                      </div>
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
