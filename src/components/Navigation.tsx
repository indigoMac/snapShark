'use client';

import { UserButton, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export function Navigation() {
  const { isSignedIn, user } = useUser();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                S
              </span>
            </div>
            <span className="font-bold text-xl">SnapShark</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </Link>

            {isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className="text-sm font-medium hover:text-primary transition-colors"
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
                  <button className="text-sm font-medium hover:text-primary transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                    Get Started
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
