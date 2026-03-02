'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Header.css';

export default function Header() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="header-brand">
                    <div className="header-logo">
                        <div className="header-logo">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="thread-logo">
                                <path d="M4 16C4 16 8 8 16 8C24 8 28 16 28 16C28 16 24 24 16 24C8 24 4 16 4 16Z" className="thread-path-outer" />
                                <circle cx="16" cy="16" r="3" className="thread-core" />
                                <path d="M2 16H30" className="thread-line" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="header-title">RedThread</h1>
                    <span className="header-badge">AI</span>
                </Link>

                <nav className="header-nav">
                    <Link href="/" className={`header-link ${isActive('/') ? 'active' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Search
                    </Link>
                    <Link href="/history" className={`header-link ${isActive('/history') ? 'active' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        History
                    </Link>
                    <Link href="/about" className={`header-link ${isActive('/about') ? 'active' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        About
                    </Link>
                    <span className="header-status">
                        <span className="status-dot"></span>
                        Online
                    </span>
                </nav>
            </div>
        </header>
    );
}
