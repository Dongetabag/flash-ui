/**
 * Build This - AISim Brand Vitreous Chat Widget
 * Premium $50 deposit checkout with glassmorphic design
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, trackInteraction, createCheckout } from '../src/lib/tracking';

interface ChatWidgetProps {
    assetId?: string;
    onClose?: () => void;
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

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const LoadingSpinner = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" opacity=".3"/>
        <path d="M20 12h2A10 10 0 0012 2v2a8 8 0 018 8z"/>
    </svg>
);

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

export default function ChatWidget({ assetId, onClose }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);
    const prevAssetIdRef = useRef<string | undefined>(undefined);

    // Auto-open when assetId changes (Build This clicked)
    useEffect(() => {
        if (assetId && assetId !== prevAssetIdRef.current) {
            setIsOpen(true);
            setError(null);
            // Track the build request
            trackInteraction({
                assetId,
                type: 'request_build',
                data: { action: 'build_modal_opened' }
            }).catch(() => {});
        }
        prevAssetIdRef.current = assetId;
    }, [assetId]);

    const handleCheckout = async () => {
        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }
        if (!assetId) {
            setError('No design selected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // First create/update lead with email
            const chatResponse = await sendChatMessage({
                assetId,
                message: `I want to build this design. My email is ${email}`,
                leadId: leadId || undefined,
                email: email.trim()
            });

            if (chatResponse?.leadId) {
                setLeadId(chatResponse.leadId);

                // Track checkout initiation
                trackInteraction({
                    assetId,
                    type: 'click',
                    data: { action: 'checkout_initiated', email: email.trim() }
                }).catch(() => {});

                // Create checkout session
                const checkoutUrl = await createCheckout(chatResponse.leadId, assetId);

                if (checkoutUrl) {
                    // Redirect to Stripe checkout
                    window.location.href = checkoutUrl;
                } else {
                    setError('Unable to create checkout. Please try again.');
                }
            } else {
                setError('Unable to process request. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault();
            handleCheckout();
        }
    };

    const toggleWidget = () => {
        setIsOpen(!isOpen);
        if (!isOpen && assetId) {
            trackInteraction({
                assetId,
                type: 'click',
                data: { action: 'build_widget_opened' }
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
                    background: rgba(3, 7, 17, 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
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
                    position: relative;
                    background: rgba(15, 23, 42, 0.65);
                    backdrop-filter: blur(32px) saturate(180%);
                    -webkit-backdrop-filter: blur(32px) saturate(180%);
                    border-radius: 32px;
                    width: 100%;
                    max-width: 440px;
                    overflow: hidden;
                    box-shadow:
                        0 20px 50px rgba(0, 0, 0, 0.5),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    animation: entryReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    z-index: 1;
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
                    padding: 32px 32px 24px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .aisim-header-content h2 {
                    font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 1.1rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #f8fafc;
                    text-transform: uppercase;
                    margin: 0 0 8px;
                }

                .aisim-status-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .aisim-status-dot {
                    width: 8px;
                    height: 8px;
                    background: #ff9f0a;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #ff9f0a, 0 0 30px rgba(255, 159, 10, 0.5);
                    animation: pulse 2s infinite;
                }

                .aisim-mono-label {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.65rem;
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

                .aisim-content {
                    padding: 32px;
                }

                .aisim-price-card {
                    background: linear-gradient(135deg, rgba(255, 159, 10, 0.1) 0%, rgba(255, 184, 64, 0.08) 50%, rgba(255, 208, 128, 0.1) 100%);
                    border: 1px solid rgba(255, 159, 10, 0.25);
                    border-radius: 20px;
                    padding: 32px;
                    text-align: center;
                    margin-bottom: 28px;
                    position: relative;
                    overflow: hidden;
                }

                .aisim-price-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #ff9f0a, #ffb840, #ffd080, transparent);
                }

                .aisim-price-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 208, 128, 0.3), transparent);
                }

                .aisim-price {
                    font-family: 'Inter', sans-serif;
                    font-size: 56px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffb840 50%, #ffd080 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0;
                    line-height: 1;
                    text-shadow: 0 0 40px rgba(255, 159, 10, 0.3);
                }

                .aisim-price-label {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin: 12px 0 0;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .aisim-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 28px;
                }
                .aisim-features li {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 0;
                    color: #f8fafc;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.88rem;
                    font-weight: 300;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .aisim-features li:last-child {
                    border-bottom: none;
                }
                .aisim-features li svg {
                    color: #ff9f0a;
                    flex-shrink: 0;
                    filter: drop-shadow(0 0 6px rgba(255, 159, 10, 0.5));
                }

                .aisim-input-container {
                    position: relative;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 4px;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .aisim-input-container:focus-within {
                    border-color: #ff9f0a;
                    box-shadow: 0 0 30px rgba(255, 159, 10, 0.2), 0 0 60px rgba(255, 208, 128, 0.1);
                }

                .aisim-email-input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #f8fafc;
                    padding: 14px 16px;
                    flex: 1;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.9rem;
                }
                .aisim-email-input::placeholder {
                    color: #64748b;
                }

                .aisim-error {
                    font-family: 'JetBrains Mono', monospace;
                    color: #f87171;
                    font-size: 0.7rem;
                    margin: 8px 0 0 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .aisim-checkout-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #ff9f0a 0%, #ffb840 40%, #ffd080 100%);
                    background-size: 200% 100%;
                    border: none;
                    border-radius: 16px;
                    padding: 18px 24px;
                    color: #0f0f1a;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    box-shadow: 0 4px 20px rgba(255, 159, 10, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                }
                .aisim-checkout-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(255, 159, 10, 0.4), 0 0 60px rgba(255, 208, 128, 0.2);
                    background-position: 100% 0;
                }
                .aisim-checkout-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .aisim-footer {
                    padding: 20px 32px 28px;
                    text-align: center;
                    background: linear-gradient(0deg, rgba(255,255,255,0.02) 0%, transparent 100%);
                }
                .aisim-footer p {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.6rem;
                    color: #64748b;
                    margin: 0;
                    letter-spacing: 0.05em;
                }
                .aisim-footer a {
                    color: #94a3b8;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }

                @media (max-width: 480px) {
                    .aisim-modal {
                        max-width: 100%;
                        border-radius: 32px 32px 0 0;
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                    }
                    .aisim-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .aisim-trigger {
                        bottom: 16px;
                        right: 16px;
                    }
                }
            `}</style>

            <button
                className={`aisim-trigger ${assetId ? 'has-asset' : ''}`}
                onClick={toggleWidget}
                aria-label="Build your design"
            >
                <BuildIcon />
            </button>

            {isOpen && (
                <div className="aisim-overlay" onClick={() => setIsOpen(false)}>
                    <div className="aisim-caustic-bg">
                        <div className="aisim-caustic-layer"></div>
                    </div>
                    <div className="aisim-modal" onClick={e => e.stopPropagation()}>
                        <header className="aisim-header">
                            <div className="aisim-header-content">
                                <h2>Build Your Design</h2>
                                <div className="aisim-status-row">
                                    <div className="aisim-status-dot"></div>
                                    <span className="aisim-mono-label">System Active // Ready to Build</span>
                                </div>
                            </div>
                            <button className="aisim-close" onClick={() => setIsOpen(false)}>
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="aisim-content">
                            <div className="aisim-price-card">
                                <p className="aisim-price">$50</p>
                                <p className="aisim-price-label">Build Deposit // Applies to Total</p>
                            </div>

                            <ul className="aisim-features">
                                <li>
                                    <CheckIcon />
                                    Professional code conversion
                                </li>
                                <li>
                                    <CheckIcon />
                                    Mobile responsive design
                                </li>
                                <li>
                                    <CheckIcon />
                                    1-on-1 consultation call
                                </li>
                                <li>
                                    <CheckIcon />
                                    Full source code ownership
                                </li>
                                <li>
                                    <CheckIcon />
                                    100% refundable guarantee
                                </li>
                            </ul>

                            <div className="aisim-input-container">
                                <input
                                    type="email"
                                    className="aisim-email-input"
                                    placeholder="Enter your email..."
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError(null);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                />
                                <button
                                    className="aisim-close"
                                    style={{ background: 'transparent', border: 'none' }}
                                    onClick={handleCheckout}
                                    disabled={isLoading || !email.trim()}
                                >
                                    {isLoading ? <LoadingSpinner /> : <SendIcon />}
                                </button>
                            </div>
                            {error && <p className="aisim-error">{error}</p>}

                            <button
                                className="aisim-checkout-btn"
                                onClick={handleCheckout}
                                disabled={isLoading || !email.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <BuildIcon />
                                        Pay $50 Deposit
                                    </>
                                )}
                            </button>
                        </div>

                        <footer className="aisim-footer">
                            <p>Secure payment via Stripe // <a href="/terms">Terms</a></p>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
}
