import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
}

const AIChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Привіт! Я Aura, ваша ШІ-асистентка. Чим можу допомогти сьогодні?", sender: 'assistant' }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            });

            if (res.ok) {
                const data = await res.json();
                const aiMsg: Message = { id: Date.now() + 1, text: data.response, sender: 'assistant' };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error("Chat error:", err);
            const errorMsg: Message = { id: Date.now() + 1, text: "Вибачте, сталася помилка з'єднання. 😔", sender: 'assistant' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Toggle Bubble */}
            <div className="ai-chat-bubble" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window dark-glass">
                    {/* Header */}
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.5px' }}>АСИСТЕНТКА AURA</span>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`ai-message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="ai-message assistant" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 20px' }}>
                                <div className="typing-dot"></div>
                                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Запитай щось про карту..."
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                color: 'white',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: '#6366f1',
                                border: 'none',
                                borderRadius: '12px',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default AIChat;
