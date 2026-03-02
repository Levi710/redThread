'use client';

import Link from 'next/link';
import './NotFound.css';

export default function NotFound() {
    return (
        <main className="not-found fade-in-up">
            <div className="not-found-content">
                <div className="not-found-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h2>404 - Page Not Found</h2>
                <p>The page you're looking for doesn't exist or has been moved.</p>
                <Link href="/" className="btn-primary">
                    Return Home
                </Link>
            </div>
        </main>
    );
}
