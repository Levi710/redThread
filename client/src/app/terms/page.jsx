'use client';

import './Terms.css';
import Link from 'next/link';

export default function Terms() {
    return (
        <main className="terms-container fade-in-up">
            <header className="terms-header">
                <h1>Terms of Use</h1>
                <p className="terms-last-updated">Last Updated: March 2026</p>
            </header>

            <section className="terms-section">
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using RedThread, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
            </section>

            <section className="terms-section">
                <h2>2. Ethical AI Use</h2>
                <p>
                    RedThread is designed to be a helpful assistant for discovering location-based information. Users are strictly prohibited from using the platform for:
                </p>
                <ul>
                    <li>Generating or promoting harmful, illegal, or adult content.</li>
                    <li>Stalking, harassment, or any form of malicious monitoring.</li>
                    <li>Automated bulk scraping beyond normal individual research use.</li>
                    <li>Attempting to bypass safety filters or platform restrictions.</li>
                </ul>
            </section>

            <section className="terms-section">
                <h2>3. Data & Privacy</h2>
                <p>
                    We value your privacy. RedThread processes your queries to provide relevant recommendations. While we strive for accuracy, AI-generated content may occasionally contain errors. Always verify critical information directly with the service provider.
                </p>
            </section>

            <section className="terms-section">
                <h2>4. Intellectual Property</h2>
                <p>
                    The technology, design, and "RedThread" brand are the intellectual property of its creators. Users are granted a limited license for personal, non-commercial use of the search results.
                </p>
            </section>

            <section className="terms-section">
                <h2>5. Disclaimer</h2>
                <p>
                    The materials on RedThread are provided on an 'as is' basis. RedThread makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, or fitness for a particular purpose.
                </p>
            </section>

            <footer className="terms-footer">
                <Link href="/" className="accent-text">Return to Search</Link>
            </footer>
        </main>
    );
}
