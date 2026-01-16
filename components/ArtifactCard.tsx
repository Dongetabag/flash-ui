/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { Artifact } from '../types';
import { trackInteraction } from '../src/lib/tracking';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
    trackingAssetId?: string;
}

const ArtifactCard = React.memo(({
    artifact,
    isFocused,
    onClick,
    trackingAssetId
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    const isBlurring = artifact.status === 'streaming';

    // Track click interaction
    const handleClick = () => {
        if (trackingAssetId) {
            trackInteraction({
                assetId: trackingAssetId,
                type: 'click',
                data: { styleName: artifact.styleName }
            }).catch(console.error);
        }
        onClick();
    };

    return (
        <div
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''}`}
            onClick={handleClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
            </div>
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                <iframe 
                    srcDoc={artifact.html} 
                    title={artifact.id} 
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                    className="artifact-iframe"
                />
            </div>
        </div>
    );
});

export default ArtifactCard;