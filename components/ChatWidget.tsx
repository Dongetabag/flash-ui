/**
 * Lead Capture Chat Widget
 * Floating chat component for AI-powered lead qualification
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, trackInteraction } from '../src/lib/tracking';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    assetId?: string;
    onClose?: () => void;
}

const ChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

export default function ChatWidget({ assetId, onClose }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hey! I'm the AISim assistant. Love what you've created! Want to turn this design into a fully functional website? I can help you get started.",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [leadId, setLeadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        // Add user message
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        try {
            // Track the chat interaction
            if (assetId) {
                trackInteraction({
                    assetId,
                    type: 'click',
                    data: { action: 'chat_message', message: userMessage }
                }).catch(() => {});
            }

            const response = await sendChatMessage({
                assetId: assetId || '',
                message: userMessage,
                leadId: leadId || undefined
            });

            if (response?.success) {
                if (response.leadId) {
                    setLeadId(response.leadId);
                }

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.message || "Thanks for your message! I'll get back to you shortly.",
                    timestamp: new Date()
                }]);

                // If checkout URL is provided, show a payment button
                if (response.checkoutUrl) {
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `Great! Click here to proceed with your deposit: [Pay Now](${response.checkoutUrl})`,
                            timestamp: new Date()
                        }]);
                    }, 500);
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I'm having trouble connecting right now. Please try again in a moment, or email us at hello@aisim.app",
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Something went wrong. Please try again or reach out to hello@aisim.app",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (assetId && !isOpen) {
            trackInteraction({
                assetId,
                type: 'click',
                data: { action: 'chat_opened' }
            }).catch(() => {});
        }
    };

    // Render message content with link support
    const renderMessageContent = (content: string) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }
            parts.push(
                <a
                    key={match.index}
                    href={match[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-link"
                >
                    {match[1]}
                </a>
            );
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <>
            <style>{`
                .chat-widget-trigger {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ff6b35 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 20px rgba(255, 159, 10, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                    z-index: 9999;
                }
                .chat-widget-trigger:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 24px rgba(255, 159, 10, 0.5);
                }
                .chat-widget-trigger.has-asset {
                    animation: pulse-glow 2s infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 4px 20px rgba(255, 159, 10, 0.4); }
                    50% { box-shadow: 0 4px 30px rgba(255, 159, 10, 0.7); }
                }

                .chat-widget {
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    width: 380px;
                    max-width: calc(100vw - 48px);
                    height: 500px;
                    max-height: calc(100vh - 120px);
                    background: #1a1a1a;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 10000;
                    animation: slide-up 0.3s ease-out;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .chat-header {
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #252525 0%, #1a1a1a 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .chat-header-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .chat-header-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ff6b35 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                }
                .chat-header h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: white;
                }
                .chat-header p {
                    margin: 2px 0 0;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                }
                .chat-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    padding: 4px;
                    transition: color 0.2s;
                }
                .chat-close:hover {
                    color: white;
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .chat-message {
                    max-width: 85%;
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .chat-message.user {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ff6b35 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .chat-message.assistant {
                    align-self: flex-start;
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                    border-bottom-left-radius: 4px;
                }
                .chat-link {
                    color: #ff9f0a;
                    text-decoration: underline;
                    font-weight: 500;
                }

                .chat-input-area {
                    padding: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 12px;
                    background: #1a1a1a;
                }
                .chat-input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 12px 16px;
                    color: white;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .chat-input:focus {
                    border-color: #ff9f0a;
                }
                .chat-input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }
                .chat-send {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ff6b35 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transition: transform 0.2s, opacity 0.2s;
                }
                .chat-send:hover:not(:disabled) {
                    transform: scale(1.05);
                }
                .chat-send:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .chat-typing {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                    align-self: flex-start;
                }
                .chat-typing span {
                    width: 8px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }
                .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
                .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }

                @media (max-width: 480px) {
                    .chat-widget {
                        bottom: 0;
                        right: 0;
                        left: 0;
                        width: 100%;
                        max-width: 100%;
                        height: 100%;
                        max-height: 100%;
                        border-radius: 0;
                    }
                    .chat-widget-trigger {
                        bottom: 16px;
                        right: 16px;
                    }
                }
            `}</style>

            <button
                className={`chat-widget-trigger ${assetId ? 'has-asset' : ''}`}
                onClick={toggleChat}
                aria-label="Open chat"
            >
                <ChatIcon />
            </button>

            {isOpen && (
                <div className="chat-widget">
                    <div className="chat-header">
                        <div className="chat-header-title">
                            <div className="chat-header-avatar">AI</div>
                            <div>
                                <h4>AISim Assistant</h4>
                                <p>Usually replies instantly</p>
                            </div>
                        </div>
                        <button className="chat-close" onClick={toggleChat}>
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-message ${msg.role}`}>
                                {renderMessageContent(msg.content)}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button
                            className="chat-send"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isLoading}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
