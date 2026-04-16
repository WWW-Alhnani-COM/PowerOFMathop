import { Suspense } from 'react';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-lg">Loading results...</div></div>}>
      <ResultsClient />
    </Suspense>
  );
}
