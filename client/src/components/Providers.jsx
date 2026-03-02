'use client';

import { ToastProvider } from '../contexts/ToastContext';

export function Providers({ children }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
