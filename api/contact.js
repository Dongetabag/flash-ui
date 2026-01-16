/**
 * AISim Contact Form API - Sends build requests to Slack
 * Uploads full HTML code as a file snippet for complete code delivery
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            name,
            email,
            project,
            message,
            buildId,
            assetId,
            style,
            prompt,
            session,
            htmlContent
        } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        const slackBotToken = process.env.SLACK_BOT_TOKEN;
        const slackChannel = process.env.SLACK_CHANNEL_ID || 'C0AA362HEV6'; // Default channel

        // Format main Slack message (customer info only)
        const slackMessage = {
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "🚀 New AISim Build Request!",
                        emoji: true
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*👤 Name:*\n${name}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*📧 Email:*\n${email}`
                        }
                    ]
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*🎨 Project:*\n${project || 'Not specified'}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*✨ Style:*\n${style || 'Custom'}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*💬 Message:*\n${message || 'No message provided'}`
                    }
                },
                {
                    type: "divider"
                }
            ]
        };

        // Add prompt section if available
        if (prompt) {
            const decodedPrompt = decodeURIComponent(prompt);
            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*🎯 Original Prompt:*\n>${decodedPrompt.substring(0, 300)}${decodedPrompt.length > 300 ? '...' : ''}`
                }
            });
        }

        // Add build metadata
        slackMessage.blocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `📋 Build ID: \`${buildId || 'N/A'}\` | Asset: \`${assetId ? assetId.substring(0, 12) + '...' : 'N/A'}\` | Session: \`${session ? session.substring(0, 12) + '...' : 'N/A'}\``
                }
            ]
        });

        // Add code status indicator
        if (htmlContent) {
            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*📦 Build Code:* ✅ Included below (${htmlContent.length.toLocaleString()} characters)`
                }
            });
        } else {
            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*📦 Build Code:* ⚠️ No code attached`
                }
            });
        }

        // Add action buttons
        slackMessage.blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "📧 Reply to Client",
                        emoji: true
                    },
                    url: `mailto:${email}?subject=Re: AISim Build Request - ${project || style || 'Your Project'}`,
                    action_id: "email_client"
                }
            ]
        });

        // Send main message via webhook
        if (slackWebhookUrl) {
            const slackResponse = await fetch(slackWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slackMessage)
            });

            if (!slackResponse.ok) {
                console.error('Slack webhook error:', await slackResponse.text());
            }
        }

        // If we have HTML content and a bot token, upload as a code snippet
        if (htmlContent && slackBotToken) {
            try {
                const filename = `${(style || 'build').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;

                // Use Slack's files.upload API for full code
                const formData = new FormData();
                formData.append('channels', slackChannel);
                formData.append('content', htmlContent);
                formData.append('filename', filename);
                formData.append('filetype', 'html');
                formData.append('title', `🎨 ${style || 'Custom Build'} - Full HTML Code`);
                formData.append('initial_comment', `📎 *Full HTML code for ${name}'s build request*\n\`\`\`Prompt: ${prompt ? decodeURIComponent(prompt).substring(0, 100) : 'N/A'}...\`\`\``);

                const uploadResponse = await fetch('https://slack.com/api/files.upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${slackBotToken}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResult.ok) {
                    console.error('Slack file upload error:', uploadResult.error);
                    // Fallback: send code as text blocks if file upload fails
                    await sendCodeAsBlocks(slackWebhookUrl, htmlContent, style);
                }
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                // Fallback: send code as text blocks
                await sendCodeAsBlocks(slackWebhookUrl, htmlContent, style);
            }
        } else if (htmlContent && slackWebhookUrl) {
            // No bot token - send code as text blocks (with truncation for large files)
            await sendCodeAsBlocks(slackWebhookUrl, htmlContent, style);
        }

        // Also forward to n8n webhook if configured
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv1167160.hstgr.cloud/webhook/aisim/contact-form';

        try {
            await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req.body)
            });
        } catch (n8nError) {
            console.error('n8n webhook error:', n8nError);
        }

        // Return success
        return res.status(200).json({
            success: true,
            message: 'Build request submitted successfully',
            buildId: buildId || `BUILD-${Date.now()}`
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
}

// Helper: Send code as multiple Slack message blocks (fallback when no bot token)
async function sendCodeAsBlocks(webhookUrl, htmlContent, style) {
    // Split into chunks of ~2500 chars to stay under Slack's 3000 char limit
    const maxChunkSize = 2500;
    const chunks = [];

    for (let i = 0; i < htmlContent.length; i += maxChunkSize) {
        chunks.push(htmlContent.substring(i, i + maxChunkSize));
    }

    // Send first chunk with header
    const firstMessage = {
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*📦 Full Build Code - ${style || 'Custom'}* (Part 1/${chunks.length})`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `\`\`\`${chunks[0]}\`\`\``
                }
            }
        ]
    };

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstMessage)
    });

    // Send remaining chunks
    for (let i = 1; i < chunks.length; i++) {
        const chunkMessage = {
            blocks: [
                {
                    type: "context",
                    elements: [{ type: "mrkdwn", text: `📄 Part ${i + 1}/${chunks.length}` }]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `\`\`\`${chunks[i]}\`\`\``
                    }
                }
            ]
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunkMessage)
        });

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Send completion message
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            blocks: [{
                type: "context",
                elements: [{ type: "mrkdwn", text: `✅ Code complete: ${htmlContent.length.toLocaleString()} characters total` }]
            }]
        })
    });
}
