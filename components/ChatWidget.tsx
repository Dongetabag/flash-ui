/**
 * AISim AI Chat Agent - Conversational AI assistant for build inquiries
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { trackInteraction } from '../src/lib/tracking';

interface ChatWidgetProps {
    assetId?: string;
    buildData?: {
        buildId?: string;
        prompt?: string;
        styleName?: string;
        htmlContent?: string;
        sessionId?: string;
    };
    onClose?: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

const BuildIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.29 7 12 12 20.71 7"/>
        <line x1="12" y1="22" x2="12" y2="12"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const LoadingSpinner = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
        <circle cx="12" cy="12" r="10" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
);

// Default greeting message
const getGreetingMessage = (styleName?: string): ChatMessage => ({
    role: 'assistant',
    content: styleName 
        ? `Hi! I'm your AISim build assistant. I see you're interested in building "${styleName}". How can I help you today?\n\n• Build timeline and process\n• Pricing and payment options\n• Customization possibilities\n• Technical requirements`
        : `Hi! I'm your AISim build assistant. I'm here to help you bring your design to life.\n\nWhat would you like to know? You can ask about:\n• Our build process\n• Pricing and timelines\n• Customization options`,
    timestamp: new Date().toISOString()
});

export default function ChatWidget({ assetId, buildData, onClose }: ChatWidgetProps) {
    // Initialize with greeting message
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([getGreetingMessage()]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [leadId, setLeadId] = useState<string | null>(null);
    const prevAssetIdRef = useRef<string | undefined>(undefined);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-open when assetId changes (Build This clicked) and update greeting
    useEffect(() => {
        if (assetId && assetId !== prevAssetIdRef.current) {
            setIsOpen(true);
            // Update with build-specific greeting
            setMessages([getGreetingMessage(buildData?.styleName)]);
            // Track the build request
            trackInteraction({
                assetId,
                type: 'request_build',
                data: { action: 'chat_agent_opened' }
            }).catch(() => {});
        }
        prevAssetIdRef.current = assetId;
    }, [assetId, buildData]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error('API key not configured');
            }

            const ai = new GoogleGenAI({ apiKey });

            // Build system prompt with context
            const systemPrompt = `You are an AI assistant for AISim, a company that builds custom web applications and UI components. 

Context about the current build:
${buildData?.styleName ? `- Design Name: ${buildData.styleName}` : ''}
${buildData?.prompt ? `- Original Prompt: ${buildData.prompt}` : ''}
${buildData?.buildId ? `- Build ID: ${buildData.buildId}` : ''}

Your role:
- Help users understand the build process
- Answer questions about pricing (starting at $50 deposit, applied to total)
- Explain customization options
- Discuss timelines and next steps
- Guide them toward checkout when ready
- Be friendly, professional, and helpful
- Keep responses concise (2-3 sentences when possible)

When the user is ready to proceed, you can mention the checkout process.`;

            // Build conversation history in the format expected by Google GenAI
            // Format: array of { role: 'user' | 'model', parts: [{ text: string }] }
            const conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
            
            // Add all previous messages
            messages.forEach(msg => {
                conversationHistory.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });

            // Add current user message
            conversationHistory.push({
                role: 'user',
                parts: [{ text: userMessage.content }]
            });

            // Build the full prompt with system instruction and conversation
            // Google GenAI expects a single user message with the full context
            const conversationText = conversationHistory
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts[0].text}`)
                .join('\n\n');

            const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nAssistant:`;

            // Generate AI response using the same pattern as index.tsx
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { 
                    role: 'user', 
                    parts: [{ text: fullPrompt }] 
                }
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.text || 'I apologize, I was unable to generate a response. Please try again.',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Track interaction (if we have an assetId)
            if (assetId) {
                trackInteraction({
                    assetId,
                    type: 'chat_message',
                    data: { 
                        message: userMessage.content,
                        responseLength: assistantMessage.content.length
                    }
                }).catch(() => {});
            }

        } catch (error) {
            console.error('AI chat error:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'I encountered an error processing your message. Please try again, or you can proceed directly to checkout to start your build.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCheckout = async () => {
        // Track checkout click if we have an assetId
        if (assetId) {
            trackInteraction({
                assetId,
                type: 'click',
                data: { action: 'proceed_to_checkout' }
            }).catch(() => {});
        }

        // Store HTML content in sessionStorage for the contact form
        if (buildData?.htmlContent) {
            sessionStorage.setItem('aisim_build_html', buildData.htmlContent);
        }

        // Build URL parameters
        const params = new URLSearchParams();
        if (buildData?.buildId) params.set('buildId', buildData.buildId);
        if (assetId) params.set('assetId', assetId);
        if (buildData?.prompt) params.set('prompt', encodeURIComponent(buildData.prompt.substring(0, 500)));
        if (buildData?.styleName) params.set('style', encodeURIComponent(buildData.styleName));
        if (buildData?.sessionId) params.set('session', buildData.sessionId);

        // Always redirect to contact form
        window.location.href = `/contact.html?${params.toString()}`;
    };

    const toggleWidget = () => {
        const willOpen = !isOpen;
        setIsOpen(willOpen);
        
        if (willOpen && assetId) {
            trackInteraction({
                assetId,
                type: 'click',
                data: { action: 'chat_widget_opened' }
            }).catch(() => {});
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&family=JetBrains+Mono:wght@300;500&display=swap');

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                @keyframes entryReveal {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes shimmer {
                    0% { transform: translate(-30%, -30%) rotate(-25deg); }
                    100% { transform: translate(30%, 30%) rotate(-25deg); }
                }

                @keyframes rotateCaustic {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .aisim-trigger {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffd080 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #0f0f1a;
                    box-shadow: 0 4px 30px rgba(255, 159, 10, 0.4);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
                    z-index: 9999;
                }
                .aisim-trigger:hover {
                    transform: scale(1.08);
                    box-shadow: 0 6px 40px rgba(255, 159, 10, 0.6);
                }
                .aisim-trigger.has-asset {
                    animation: pulse 2s infinite;
                }

                .aisim-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(3, 7, 17, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 10000;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 0;
                    pointer-events: none;
                }
                
                .aisim-overlay.active {
                    pointer-events: auto;
                }

                .aisim-caustic-bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    z-index: 0;
                    filter: blur(80px);
                    opacity: 0.5;
                    pointer-events: none;
                }

                .aisim-caustic-layer {
                    position: absolute;
                    width: 150%;
                    height: 150%;
                    top: -25%;
                    left: -25%;
                    background: conic-gradient(
                        from 180deg at 50% 50%,
                        transparent 0deg,
                        rgba(255, 159, 10, 0.5) 90deg,
                        rgba(255, 184, 64, 0.4) 150deg,
                        rgba(255, 208, 128, 0.4) 240deg,
                        rgba(255, 159, 10, 0.3) 300deg,
                        transparent 360deg
                    );
                    animation: rotateCaustic 15s linear infinite;
                }

                .aisim-modal {
                    position: fixed;
                    bottom: 100px;
                    right: 24px;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(32px) saturate(180%);
                    -webkit-backdrop-filter: blur(32px) saturate(180%);
                    border-radius: 20px;
                    width: 380px;
                    height: 500px;
                    max-height: calc(100vh - 140px);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow:
                        0 20px 60px rgba(0, 0, 0, 0.6),
                        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    animation: entryReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    z-index: 10001;
                    pointer-events: auto;
                }

                .aisim-modal::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent 45%,
                        rgba(255, 255, 255, 0.05) 48%,
                        rgba(255, 255, 255, 0.1) 50%,
                        rgba(255, 255, 255, 0.05) 52%,
                        transparent 55%
                    );
                    transform: rotate(-25deg);
                    pointer-events: none;
                    animation: shimmer 8s infinite linear;
                }

                .aisim-header {
                    padding: 16px 18px 12px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }

                .aisim-header-content h2 {
                    font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 1rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #f8fafc;
                    text-transform: uppercase;
                    margin: 0;
                }

                .aisim-status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 6px;
                }

                .aisim-status-dot {
                    width: 6px;
                    height: 6px;
                    background: #ff9f0a;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #ff9f0a;
                    animation: pulse 2s infinite;
                }

                .aisim-mono-label {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.6rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .aisim-close {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #94a3b8;
                    transition: all 0.3s;
                }
                .aisim-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .aisim-chat-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-height: 0;
                }
                
                .aisim-chat-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .aisim-chat-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .aisim-chat-container::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
                
                .aisim-chat-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .aisim-message {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    animation: entryReveal 0.3s ease-out;
                }

                .aisim-message.user {
                    align-items: flex-end;
                }

                .aisim-message.assistant {
                    align-items: flex-start;
                }

                .aisim-message-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .aisim-message.user .aisim-message-bubble {
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffb840 100%);
                    color: #0f0f1a;
                    border-bottom-right-radius: 4px;
                }

                .aisim-message.assistant .aisim-message-bubble {
                    background: rgba(255, 255, 255, 0.08);
                    color: #f8fafc;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom-left-radius: 4px;
                }

                .aisim-input-container {
                    padding: 12px 16px 14px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: linear-gradient(0deg, rgba(255,255,255,0.03) 0%, transparent 100%);
                    flex-shrink: 0;
                }

                .aisim-input-wrapper {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 4px 4px 4px 16px;
                    transition: all 0.3s ease;
                }

                .aisim-input-wrapper:focus-within {
                    border-color: #ff9f0a;
                    box-shadow: 0 0 20px rgba(255, 159, 10, 0.2);
                }

                .aisim-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.9rem;
                    padding: 10px 0;
                }

                .aisim-input::placeholder {
                    color: #64748b;
                }

                .aisim-send-btn {
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffb840 100%);
                    border: none;
                    border-radius: 12px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #0f0f1a;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .aisim-send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 159, 10, 0.4);
                }

                .aisim-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .aisim-checkout-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffb840 40%, #ffd080 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 14px 20px;
                    min-height: 48px;
                    color: #0f0f1a;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 12px;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                }

                .aisim-checkout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(255, 159, 10, 0.4);
                }

                .aisim-checkout-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 15px rgba(255, 159, 10, 0.3);
                }

                .aisim-checkout-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                @media (max-width: 480px) {
                    .aisim-modal {
                        width: calc(100vw - 32px);
                        max-width: 380px;
                        height: calc(100vh - 140px);
                        max-height: 500px;
                        bottom: 100px;
                        right: 16px;
                        left: auto;
                    }
                    .aisim-overlay {
                        align-items: flex-end;
                        justify-content: flex-end;
                    }
                    .aisim-trigger {
                        bottom: 16px;
                        right: 16px;
                    }
                    .aisim-checkout-btn {
                        padding: 16px 20px;
                        min-height: 52px;
                        font-size: 0.9rem;
                    }
                    .aisim-send-btn {
                        min-width: 40px;
                        min-height: 40px;
                    }
                    .aisim-input {
                        font-size: 1rem;
                        padding: 12px 0;
                    }
                }
            `}</style>

            <button
                className={`aisim-trigger ${assetId ? 'has-asset' : ''}`}
                onClick={toggleWidget}
                aria-label="Chat with AI assistant"
            >
                <BuildIcon />
            </button>

            {isOpen && (
                <div className="aisim-overlay active" onClick={() => setIsOpen(false)}>
                    <div className="aisim-caustic-bg">
                        <div className="aisim-caustic-layer"></div>
                    </div>
                    <div className="aisim-modal" onClick={e => e.stopPropagation()}>
                        <header className="aisim-header">
                            <div className="aisim-header-content">
                                <h2>AISim AI Assistant</h2>
                                <div className="aisim-status-row">
                                    <div className="aisim-status-dot"></div>
                                    <span className="aisim-mono-label">Online // Ready to Help</span>
                                </div>
                            </div>
                            <button className="aisim-close" onClick={() => setIsOpen(false)}>
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="aisim-chat-container">
                            {/* Always show greeting if no messages */}
                            {messages.length === 0 && (
                                <div className="aisim-message assistant">
                                    <div className="aisim-message-bubble">
                                        Hi! I'm your AISim build assistant. I'm here to help you bring your design to life.

What would you like to know? You can ask about:
• Our build process
• Pricing and timelines
• Customization options
                                    </div>
                                </div>
                            )}
                            {messages.map((message, index) => (
                                <div key={index} className={`aisim-message ${message.role}`}>
                                    <div className="aisim-message-bubble">
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="aisim-message assistant">
                                    <div className="aisim-message-bubble">
                                        <LoadingSpinner />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="aisim-input-container">
                            <div className="aisim-input-wrapper">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="aisim-input"
                                    placeholder="Ask me anything about your build..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                />
                                <button
                                    className="aisim-send-btn"
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                >
                                    {isLoading ? <LoadingSpinner /> : <SendIcon />}
                                </button>
                            </div>
                            <button
                                className="aisim-checkout-btn"
                                onClick={handleCheckout}
                            >
                                Build Now →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
