import Link from 'next/link';
import './SafetyBanner.css';

export default function SafetyBanner() {
    return (
        <aside className="safety-banner">
            <div className="safety-banner-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>
            <div className="safety-banner-content">
                <p className="safety-banner-text">
                    RedThread uses AI-powered safety validation. Harmful, illegal, or adult content queries are automatically blocked.
                    By searching, you agree to our <Link href="/terms">Terms of Use</Link> and accept responsibility for ethical use.
                </p>
            </div>
        </aside>
    );
}
