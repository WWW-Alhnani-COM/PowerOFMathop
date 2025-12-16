// src/components/SessionProviderWrapper.jsx

'use client' // 👈 لا يمكن الاستغناء عن هذا السطر

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function SessionProviderWrapper({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}