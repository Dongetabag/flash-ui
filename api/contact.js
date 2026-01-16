/**
 * AISim Contact Form API - Sends build requests to Slack
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

        // Format Slack message
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
                            text: `*Name:*\n${name}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*Email:*\n${email}`
                        }
                    ]
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*Project:*\n${project || 'Not specified'}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*Style:*\n${style || 'Custom'}`
                        }
                    ]
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Message:*\n${message || 'No message provided'}`
                    }
                },
                {
                    type: "divider"
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `📋 Build ID: \`${buildId || 'N/A'}\` | Asset: \`${assetId ? assetId.substring(0, 12) + '...' : 'N/A'}\` | Session: \`${session ? session.substring(0, 12) + '...' : 'N/A'}\``
                        }
                    ]
                }
            ]
        };

        // Add prompt section if available
        if (prompt) {
            slackMessage.blocks.splice(4, 0, {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Original Prompt:*\n\`\`\`${prompt.substring(0, 500)}${prompt.length > 500 ? '...' : ''}\`\`\``
                }
            });
        }

        // Add HTML code preview if available
        if (htmlContent) {
            // Slack has a 3000 char limit per text block, so truncate code preview
            const maxCodeLength = 2500;
            const codePreview = htmlContent.length > maxCodeLength
                ? htmlContent.substring(0, maxCodeLength) + '\n... [truncated]'
                : htmlContent;

            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*📦 Build Code Preview:*`
                }
            });

            slackMessage.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `\`\`\`${codePreview}\`\`\``
                }
            });

            slackMessage.blocks.push({
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `📊 Total code: ${htmlContent.length} characters`
                    }
                ]
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
                    url: `mailto:${email}?subject=Re: AISim Build Request - ${project || 'Your Project'}`,
                    action_id: "email_client"
                }
            ]
        });

        // Send to Slack webhook
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        
        if (slackWebhookUrl) {
            const slackResponse = await fetch(slackWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(slackMessage)
            });

            if (!slackResponse.ok) {
                console.error('Slack webhook error:', await slackResponse.text());
            }
        } else {
            console.warn('SLACK_WEBHOOK_URL not configured');
        }

        // Also forward to n8n webhook if configured
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv1167160.hstgr.cloud/webhook/aisim/contact-form';
        
        try {
            await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(req.body)
            });
        } catch (n8nError) {
            console.error('n8n webhook error:', n8nError);
            // Don't fail the request if n8n fails
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
