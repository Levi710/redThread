import { useState, useRef, useEffect } from 'react';
import './ClarificationPrompt.css';

export default function ClarificationPrompt({ question, onSubmit, onCancel }) {
    const [answer, setAnswer] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [question]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (answer.trim()) {
            onSubmit(answer.trim());
        }
    };

    return (
        <div className="clarification-prompt fade-in-up">
            <div className="clarification-header">
                <span className="clarification-icon">🤖</span>
                <span className="clarification-title">Clarification Needed</span>
                <button type="button" className="clarification-close" onClick={onCancel} title="Cancel search">
                    &times;
                </button>
            </div>

            <p className="clarification-question">{question}</p>

            <form className="clarification-form" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    className="clarification-input"
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                />
                <button type="submit" className="clarification-btn" disabled={!answer.trim()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send
                </button>
            </form>
        </div>
    );
}
