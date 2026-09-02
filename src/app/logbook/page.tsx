'use client';

import { Suspense } from 'react';
import LogbookClient from './LogbookClient';

export default function LogbookPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-500">
          Loading logbook…
        </div>
      }
    >
      <LogbookClient />
    </Suspense>
  );
}
