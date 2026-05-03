import React from 'react';
import { Spinner } from './Spinner';

export function FullPageLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}
