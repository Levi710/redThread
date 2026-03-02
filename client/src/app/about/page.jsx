'use client';

import '../About.css';

const TECH_STACK = [
    { name: 'React 19', desc: 'Component-based UI with hooks', icon: '⚛️' },
    { name: 'Next.js 15', desc: 'App Router, Server Components, and optimized performance', icon: '🚀' },
    { name: 'Express', desc: 'Layered REST API with middleware', icon: '🛤️' },
    { name: 'Groq + Llama 3.3', desc: 'LLM intent parsing and review analysis', icon: '🧠' },
    { name: 'Helmet + CORS', desc: 'Security headers and cross-origin policy', icon: '🛡️' },
    { name: 'Rate Limiting', desc: 'Per-IP request throttling', icon: '⏱️' },
];

const ARCHITECTURE = [
    { layer: 'Routes', purpose: 'HTTP endpoint definitions', interview: 'Keeps routing declarative and separate from logic' },
    { layer: 'Middleware', purpose: 'Cross-cutting concerns (auth, safety, rate limit)', interview: 'Runs before controller — reject early, save resources' },
    { layer: 'Controllers', purpose: 'Thin orchestration layer', interview: 'Calls services in order, shapes response — no business logic here' },
    { layer: 'Services', purpose: 'Business logic (AI, scraping, safety)', interview: 'Independently testable, reusable across routes' },
    { layer: 'Validators', purpose: 'Request body schema validation', interview: 'Fail fast with clear messages before processing' },
];

export default function About() {
    return (
        <main className="about">
            <section className="about-hero fade-in-up">
                <h2 className="about-title">
                    What is <span className="accent-text">RedThread</span>?
                </h2>
                <p className="about-lead">
                    RedThread is an AI that thinks before it searches.
                    By interpreting your intent and adapting to context, it removes the noise
                    of traditional search to find results that actually match your needs.
                </p>
            </section>

            <section className="about-section fade-in-up stagger-1">
                <h3>How It Works</h3>
                <div className="about-pipeline">
                    {['User Query', 'Safety Check', 'AI Intent Parsing', 'Smart Scraping', 'Review Analysis', 'Structured Results'].map((step, i) => (
                        <div key={i} className="pipeline-step">
                            <span className="pipeline-num">{i + 1}</span>
                            <span className="pipeline-label">{step}</span>
                            {i < 5 && <span className="pipeline-arrow">→</span>}
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-section fade-in-up stagger-2">
                <h3>Tech Stack</h3>
                <div className="about-grid">
                    {TECH_STACK.map((t, i) => (
                        <div key={i} className="about-card">
                            <span className="about-card-icon">{t.icon}</span>
                            <h4>{t.name}</h4>
                            <p>{t.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-section fade-in-up stagger-3">
                <h3>Backend Architecture</h3>
                <div className="about-table-wrap">
                    <table className="about-table">
                        <thead>
                            <tr><th>Layer</th><th>Purpose</th><th>Why It Matters</th></tr>
                        </thead>
                        <tbody>
                            {ARCHITECTURE.map((a, i) => (
                                <tr key={i}>
                                    <td className="about-table-layer">{a.layer}</td>
                                    <td>{a.purpose}</td>
                                    <td className="about-table-interview">{a.interview}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="about-section fade-in-up stagger-4">
                <h3>Safety Philosophy</h3>
                <div className="about-safety">
                    <div className="about-safety-item">
                        <span className="about-safety-icon">🚫</span>
                        <div>
                            <h4>Query Moderation</h4>
                            <p>Harmful, illegal, and adult content queries are blocked before they reach any service.</p>
                        </div>
                    </div>
                    <div className="about-safety-item">
                        <span className="about-safety-icon">🔒</span>
                        <div>
                            <h4>Platform Restrictions</h4>
                            <p>Scraping is limited to publicly available data. Social media and private platforms are blocked.</p>
                        </div>
                    </div>
                    <div className="about-safety-item">
                        <span className="about-safety-icon">⚖️</span>
                        <div>
                            <h4>User Responsibility</h4>
                            <p>Users agree to Terms of Use and accept responsibility for ethical, legal use of results.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
